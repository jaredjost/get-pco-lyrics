window.addEventListener('load', function() {
  const CLIENT_ID =
    'a892135e04e60ac990969c510b4a88fadbe525abc269593ef25b0f0ebff06143';
  const REDIRECT_URI = 'https://get-pco-lyrics.herokuapp.com';
  const PCO_AUTH_URL = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=services`;
  const CODE = new URL(window.location).searchParams.get('code');
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = +localStorage.getItem('expires_at');
  const loginBtn = document.getElementById('login');
  const logoutBtn = document.getElementById('logout');
  const getLyricsBtn = document.getElementById('get-lyrics');
  const lyricsPre = document.getElementById('lyrics');

  loginBtn.addEventListener('click', () => {
    window.location = PCO_AUTH_URL;
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    getLyricsBtn.style.display = 'none';
    lyricsPre.style.display = 'none';
  });

  getLyricsBtn.addEventListener('click', () => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`
    };
    axios
      .get('https://api.planningcenteronline.com/services/v2/service_types', { headers })
      .then(result => {
        lyricsPre.innerHTML = JSON.stringify(
          result.data,
          null,
          2
        );
      })
      .catch(error => {
        console.log('error ', error);
      });
  });

  if (CODE) {
    axios
      .post('/auth/exchange', { CODE })
      .then(function(result) {
        const expiresAt = JSON.stringify(
          result.data.expiresIn * 1000 + new Date().getTime()
        );
        localStorage.setItem('access_token', result.data.accessToken);
        localStorage.setItem('expires_at', expiresAt);
        window.location.search = '';
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  if (accessToken && new Date().getTime() < expiresAt) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    getLyricsBtn.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    getLyricsBtn.style.display = 'none';
  }
});
