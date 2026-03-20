const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      googleServicesFile: './android/app/google-services.json',
    },
    "plugins": [
    "@react-native-firebase/app",
    "@react-native-firebase/messaging"
  ],
    extra: {
      kakaoClientId: process.env.KAKAO_CLIENT_ID,
      kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI,
    },
  },
};
