const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://10.0.2.2:8080',
      kakaoClientId: process.env.KAKAO_CLIENT_ID,
      kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI,
    },
  },
};
