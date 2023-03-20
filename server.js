const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(bodyParser());

app.use(express.static(__dirname));

app.get('/healthz', (req, res) => {
  res.status(200).json({ 'message': 'health check'})
})

app.post('/auth/exchange', (req, res) => {
  const CODE = req.body.CODE;
  axios.post('https://api.planningcenteronline.com/oauth/token', {
    "grant_type": "authorization_code",
    "code": CODE,
    "client_id": process.env.CLIENT_ID,
    "client_secret": process.env.CLIENT_SECRET,
    "redirect_uri": process.env.REDIRECT_URI
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
  var port = process.env.PORT;
  if (process.env.PORT == null)
  {
    port = "8080";
  }
  console.log('Server app listening on port ' + port);
});
