window.addEventListener('load', function() {
  const CLIENT_ID =
    'a892135e04e60ac990969c510b4a88fadbe525abc269593ef25b0f0ebff06143';
  const REDIRECT_URI = 'https://get-pco-lyrics.onrender.com';
  //const REDIRECT_URI = 'http://localhost:5000';
  const PCO_AUTH_URL =
    `https://api.planningcenteronline.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=services`;
  const CODE = new URL(window.location).searchParams.get('code');
  const accessToken = localStorage.getItem('access_token');
  const expiresAt = +localStorage.getItem('expires_at');
  const btnLogin = document.getElementById('login-btn');
  const btnLogout = document.getElementById('logout-btn');
  const divServiceType = document.getElementById('service-type-div');
  const divStatus = document.getElementById('status-div');
  const divSongList = document.getElementById('song-list-div');
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
    console.log('accessToken: ', accessToken);
    console.log('expiresAt: ', expiresAt);
    console.log('current time: ', new Date().getTime());
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

  function copyToClipboard(txt) {
    // Code source: https://stackoverflow.com/questions/23048550/how-to-copy-a-divs-content-to-clipboard-without-flash
    // Create a new textarea element and give it id='t'
    let textarea = document.createElement('textarea')
    textarea.id = 't'
    // Optional step to make less noise on the page, if any!
    textarea.style.height = 0
    // Now append it to your page somewhere, I chose <body>
    document.body.appendChild(textarea)
    // Give our textarea a value of whatever inside the div of id='to-copy'
    textarea.value = txt.trim()
    // Now copy whatever inside the textarea to clipboard
    let selector = document.querySelector('#t')
    selector.select()
    document.execCommand('copy')
    // Remove the textarea
    document.body.removeChild(textarea)
  }

  function onServiceTypeChanged() {
    console.log('onServiceTypeChanged()');
    processPlans(this.value);
  }

  function appendText(element, text) {
    element.appendChild(document.createTextNode(text));
  }

  function appendElement(element, elementType) {
    element.appendChild(document.createElement(elementType));
  }

  function onLogout() {
    console.log('onLogout()');
    btnLogin.style.display = 'inline-block';
    btnLogout.style.display = 'none';
    divServiceType.style.display = 'none';
    divStatus.style.display = 'none';
    divSongList.style.display = 'none';
    divSongs.style.display = 'none';
  }

  function onLogin() {
    console.log('onLogin()');
    btnLogin.style.display = 'none';
    btnLogout.style.display = 'inline-block';
    divServiceType.style.display = '';
    divStatus.style.display = '';
    divSongList.style.display = '';
    divSongs.style.display = '';

    appendText(divServiceType, 'Accessing PCO... ');
    axios
      .get('https://api.planningcenteronline.com/services/v2', { headers })
      .then(result => {
        appendText(divServiceType, result.data.data.attributes.name);
        appendElement(divServiceType, 'br');
        processServiceTypes();
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processServiceTypes() {
    console.log('processServiceTypes()');
    axios
      .get('https://api.planningcenteronline.com/services/v2/service_types', { headers })
      .then(result => {
        var serviceTypes = result.data.data;
        if (serviceTypes.length == 1) {
          appendText(divServiceType, 'Service Type: ' + serviceTypes[0].attributes.name);
          processPlans(serviceTypes[0].links.self + '/plans');
        } else if (serviceTypes.length > 1) {
          appendText(divServiceType, 'Service Type: ');
          var select = document.getElementById('service-type-sel');
          var select = document.createElement('select');
          select.id = 'service-type-sel';
          select.addEventListener('change', onServiceTypeChanged);
          for (i in serviceTypes) {
            var opt = new Option();
            opt.value = serviceTypes[i].links.self + '/plans';
            opt.text = serviceTypes[i].attributes.name;
            select.options.add(opt);
          }
          divServiceType.appendChild(select);
          processPlans(serviceTypes[0].links.self + '/plans');
        } else {
          console.log('No service types found');
        }
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processPlans(url) {
    console.log('processPlans(' + url + ')');
    divStatus.innerHTML = '';
    divSongList.innerHTML = '';
    divSongs.innerHTML = '';
    appendText(divStatus, 'Searching for the next upcoming plan... ');
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
        if (result.data.data.length > 0) {
          var nextPlan = result.data.data[0];
          appendText(divStatus, nextPlan.attributes.dates);
          appendElement(divStatus, 'br');
          processItems(nextPlan.links.self + '/items', 0);
        } else {
          appendText(divStatus, 'No future plans found');
        }
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
        appendText(divStatus, 'Searching for songs... ');

        var chkSelectAll = document.createElement('input');
        chkSelectAll.type = 'checkbox';
        chkSelectAll.id = 'select-all-chk';
        chkSelectAll.addEventListener('click', function() {
          var chkSelectAll = document.getElementById('select-all-chk');
          for (i in divSongList.childNodes) {
            var element = divSongList.childNodes[i];
            if (element.type == 'checkbox' && element.id != 'select-all-chk') {
              element.checked = chkSelectAll.checked;
            }
          }
        });
        divSongList.appendChild(chkSelectAll);
        appendText(divSongList, ' select all ');

        var btnCopy = document.createElement('button');
        btnCopy.id = 'copy-btn';
        btnCopy.addEventListener('click', function() {
          var lyrics = '';
          var chkSelectAll = document.getElementById('select-all-chk');
          for (i in divSongList.childNodes) {
            var element = divSongList.childNodes[i];
            if (element.type == 'checkbox' &&
                element.id != 'select-all-chk' &&
                element.checked) {
              console.log('Getting contents of ' + element.id + '-pre');
              lyrics += document.getElementById(element.id + '-pre').innerText;
              count++;
            }
          }
          if (lyrics.length > 0) {
            console.log('Selected songs copied to clipboard');
            copyToClipboard(lyrics);
          } else {
            alert('Please select at least one song to copy');
          }
        });
        appendText(btnCopy, 'Copy To Clipboard');
        divSongList.appendChild(btnCopy);

        var count = 0;
        for (i in items) {
          if (items[i].attributes.item_type == 'song') {
            isFound = true;
            count++;
            appendElement(divSongList, 'br');

            var songId = items[i].relationships.arrangement.data.id;
            var chkSong = document.createElement('input');
            chkSong.type = 'checkbox';
            chkSong.id = songId;
            chkSong.addEventListener('click', function() {
              document.getElementById('select-all-chk').checked = false;
            });
            divSongList.appendChild(chkSong);

            var spanSong = document.createElement('span');
            spanSong.id = songId + '-span';
            appendText(spanSong, ' ' + count + ': ' + items[i].attributes.title + ' ');
            divSongList.appendChild(spanSong);

            var preSong = document.createElement('pre');
            preSong.id = songId + '-pre';
            divSongs.appendChild(preSong);

            processSong(items[i].links.self + '/arrangement', items[i].attributes.description);
          }
        }
        if (isFound) {
          chkSelectAll.click();
        } else {
          divSongList.innerHTML = '';
          appendText(divStatus, 'No songs found');
        }
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processSong(url, description) {
    console.log('processSong(' + url + ', ' + description + ')');
    axios
      .get(url, { headers })
      .then(result => {
        var song = result.data.data;
        var chart = song.attributes.chord_chart;
        var preSong = document.getElementById(song.id + '-pre');
        if (chart != null) {
          var divChart = document.createElement('div');
          divChart.innerHTML = formatSong(chart, description, song.id) + '\n\n';
          preSong.appendChild(divChart);
        } else {
          appendText(preSong, 'No lyrics found\n\n');
        }
        processSongInfo(preSong, 'https://api.planningcenteronline.com/services/v2/songs/' + song.relationships.song.data.id);
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function processSongInfo(preSong, url) {
    console.log('processSongInfo(' + url + ')');
    axios
      .get(url, { headers })
      .then(result => {
        var songInfo = result.data.data;
        var divSongInfo = document.createElement('div');
        appendText(divSongInfo, songInfo.attributes.title + '\n');
        var author = songInfo.attributes.author;
        if (author != null) {
          appendText(divSongInfo, '(' + author + ')\n');
        }
        appendElement(divSongInfo, 'br');
        preSong.insertBefore(divSongInfo, preSong.firstChild);
      })
      .catch(error => {
        console.log('error ', error);
      });
  }

  function formatSong(chart, description, songId) {
    if (chart != null) {
      chart = chart.trim();
      chart = chart.replace(/\[.*?\]/g, '');
      chart = chart.replace(/COLUMN_BREAK/g, '');
      chart = chart.replace(/PAGE_BREAK/g, '');
      chart = chart.replace(/<hide>.*<\/hide>/g, '');

      var includedVerses = null;
      if (description != null && description.charAt(0).toLowerCase() == 'v') {
        includedVerses = description.match(/\d/g);
        if (includedVerses != null) {
          var spanSongTitle = document.getElementById(songId + '-span');
          includedVerses = includedVerses.toString().replace(/,/g, ', ');
          appendText(spanSongTitle, ' (verses ' + includedVerses + ' only)');
        }
      }

      var lyrics = '';
      var excludeFlg = false;
      var lines = chart.split('\n');
      for (var i=0; i < lines.length; i++) {
        if (lines[i].toLowerCase().startsWith('verse') ||
            lines[i].toLowerCase().startsWith('chorus') ||
            lines[i].toLowerCase().startsWith('pre') ||
            lines[i].toLowerCase().startsWith('bridge')) {
          excludeFlg = false;
          if (lines[i].toLowerCase().startsWith('verse') && includedVerses != null) {
            var verseNumber = lines[i].substring(5, lines[i].trim().length).trim();
            if (!includedVerses.includes(verseNumber)) {
              excludeFlg = true;
            }
          }
        }
        if (!excludeFlg) {
          lyrics += lines[i] + '\n';
        }
      }
      chart = lyrics.trim();
    }
    return chart;
  }
});
