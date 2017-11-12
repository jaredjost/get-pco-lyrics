window.addEventListener('load', function() {
  const CLIENT_ID =
    'fb493d88a959b9739c138854efc3c678b90ba1b324c249aa5db7e80bad45dd4b';
  const REDIRECT_URI = 'https://pco-demo.herokuapp.com';
  const PCO_AUTH_URL = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=people`;
  const CODE = new URL(window.location).searchParams.get('code');
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = +localStorage.getItem('expires_at');
  const loginBtn = document.getElementById('login');
  const logoutBtn = document.getElementById('logout');
  const getPeopleBtn = document.getElementById('get-people');
  const peoplePre = document.getElementById('people');

  loginBtn.addEventListener('click', () => {
    window.location = PCO_AUTH_URL;
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    getPeopleBtn.style.display = 'none';
    peoplePre.style.display = 'none';
  });

  getPeopleBtn.addEventListener('click', () => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`
    };
    axios
      .get('https://api.planningcenteronline.com/people/v2/people', { headers })
      .then(result => {
        peoplePre.innerHTML = JSON.stringify(
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
    getPeopleBtn.style.display = 'inline-block';
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    getPeopleBtn.style.display = 'none';
  }
});
