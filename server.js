const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser());

const CLIENT_ID = 'a892135e04e60ac990969c510b4a88fadbe525abc269593ef25b0f0ebff06143';
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.CALLBACK_URL;

app.use(express.static(__dirname));

app.get('/healthz', (req, res) => {
  res.status(200).json({ 'message': 'health check'})
})

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
