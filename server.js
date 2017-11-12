const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser());

const CLIENT_ID = 'fb493d88a959b9739c138854efc3c678b90ba1b324c249aa5db7e80bad45dd4b';
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://pco-demo.herokuapp.com';

app.use(express.static(__dirname));

app.post('/auth/exchange', (req, res) => {
  const CODE = req.body.CODE;
  axios.post('https://api.planningcenteronline.com/oauth/token', {
    "grant_type": "authorization_code",
    "code": CODE,
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "redirect_uri": REDIRECT_URI
  }).then(result => {
    const accessToken = result.data.access_token;
    const expiresIn = result.data.expires_in;
    res.send({ accessToken, expiresIn });
  }).catch(err => {
    console.log(err)
    res.send(err);
  });
});

app.listen(process.env.PORT || 8080, () => {
  console.log('App running on localhost:8080');
});