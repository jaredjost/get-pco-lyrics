window.addEventListener('load', function() {
  const CLIENT_ID =
    'a892135e04e60ac990969c510b4a88fadbe525abc269593ef25b0f0ebff06143';
  const REDIRECT_URI = 'https://get-pco-lyrics.herokuapp.com';
  //const REDIRECT_URI = 'http://localhost:5000';
  const PCO_AUTH_URL = `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=services`;
  const CODE = new URL(window.location).searchParams.get('code');
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = +localStorage.getItem('expires_at');
  const btnLogin = document.getElementById('login-btn');
  const btnLogout = document.getElementById('logout-btn');
  const btnGetLyrics = document.getElementById('get-lyrics-btn');
  const divLyrics = document.getElementById('lyrics-div');
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('access_token')}`
  };

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
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    btnGetLyrics.style.display = 'inline-block';
  } else {
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnGetLyrics.style.display = 'none';
  }

  btnLogin.addEventListener('click', () => {
    window.location = PCO_AUTH_URL;
  });

  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnGetLyrics.style.display = 'none';
    divLyrics.style.display = 'none';
  });

  btnGetLyrics.addEventListener('click', () => {
    axios
      .get('https://api.planningcenteronline.com/services/v2/service_types', { headers })
      .then(result => {
        var serviceTypes = result.data.data;
        for (i in serviceTypes) {
          if (serviceTypes[i].attributes.name == "Sunday Service" && serviceTypes[i].type == "ServiceType") {
            processPlans(serviceTypes[i].links.self + "/plans");
            break;
          }
        }
      })
      .catch(error => {
        console.log('error ', error);
      });
  });

  function processPlans(url) {
    axios
      .get(url, { headers })
      .then(result => {
        var plans = result.data;
        processFuturePlans(plans.links.self + '?filter=future');
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processFuturePlans(url) {
    axios
      .get(url, { headers })
      .then(result => {
        var nextPlan = result.data.data[0];
        console.log('service: ' + nextPlan.attributes.dates);
        processItems(nextPlan.links.self + '/items', 0);
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  function processItems(url) {
    axios
      .get(url, { headers })
      .then(result => {
        var items = result.data.data;
        for (i in items) {
          if (items[i].attributes.item_type == 'song') {
            console.log('song: ' + items[i].attributes.title);
            var newpre = document.createElement('pre');
            newpre.id = items[i].relationships.arrangement.data.id;
            newpre.innerHTML = items[i].attributes.title + '\n\n';
            divLyrics.appendChild(newpre);
            processSong(items[i].links.self + '/arrangement');
          }
        }
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processSong(url) {
    axios
      .get(url, { headers })
      .then(result => {
        var song = result.data.data;
        var chart = song.attributes.chord_chart;
        var pre = document.getElementById(song.id);
        pre.innerHTML += format(chart) + '\n\n';
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function format(str) {
    str = str.trim();
    str = str.replace(/\[.*?\]/g, "");
    str = str.replace(/COLUMN_BREAK/g, "");
    str = str.replace(/PAGE_BREAK/g, "");
    str = str.replace(/<hide>.*<\/hide>/g, "");
    return str;
  }
});
