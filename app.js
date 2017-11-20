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
  const btnCopy = document.getElementById('copy-btn');
  const divStatus = document.getElementById('status-div');
  const divSongs = document.getElementById('songs-div');
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
    onLogin();
  } else {
    onLogout();
  }

  btnLogin.addEventListener('click', () => {
    window.location = PCO_AUTH_URL;
  });

  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
    onLogout();
  });

  btnCopy.addEventListener('click', () => {
    var elementId = 'songs-div';
    if (document.selection) {
      var range = document.body.createTextRange();
      range.moveToElementText(document.getElementById(elementId));
      range.select().createTextRange();
      document.execCommand("Copy");
    } else if (window.getSelection) {
      var range = document.createRange();
      range.selectNode(document.getElementById(elementId));
      window.getSelection().addRange(range);
      document.execCommand("Copy");
    }
  });

  function onLogout() {
    console.log('onLogout()');
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    btnCopy.style.display = 'none';
    divStatus.style.display = 'none';
    divSongs.style.display = 'none';
  }

  function onLogin() {
    console.log('onLogin()');
    divStatus.innerHTML = 'Searching for services... ';
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    btnCopy.style.display = 'inline-block';
    divStatus.style.display = '';
    divSongs.style.display = '';
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
  }

  function processPlans(url) {
    console.log('processPlans(' + url + ')');
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
    console.log('processFuturePlans(' + url + ')');
    axios
      .get(url, { headers })
      .then(result => {
        var nextPlan = result.data.data[0];
        divStatus.innerHTML += nextPlan.attributes.dates + "<br>";
        processItems(nextPlan.links.self + '/items', 0);
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  function processItems(url) {
    console.log('processItems(' + url + ')');
    axios
      .get(url, { headers })
      .then(result => {
        var items = result.data.data;
        var isFound = false;
        divStatus.innerHTML += 'Searching for songs...<br>';
        for (i in items) {
          if (items[i].attributes.item_type == 'song') {
            isFound = true;
            divStatus.innerHTML += items[i].attributes.title + '<br>';
            var preSong = document.createElement('pre');
            preSong.id = items[i].relationships.arrangement.data.id;
            preSong.innerHTML = items[i].attributes.title + '\n\n';
            divSongs.appendChild(preSong);
            processSong(items[i].links.self + '/arrangement');
          }
        }
        if (!isFound) {
          divStatus.innerHTML += 'No songs found';
        }
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processSong(url) {
    console.log('processSong(' + url + ')');
    axios
      .get(url, { headers })
      .then(result => {
        var song = result.data.data;
        var chart = song.attributes.chord_chart;
        var preSong = document.getElementById(song.id);
        preSong.innerHTML += format(chart) + '\n\n';
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
