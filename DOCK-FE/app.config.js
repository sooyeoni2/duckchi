const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
        usesCleartextTraffic: true,
      googleServicesFile: './android/app/google-services.json',
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://10.0.2.2:8080',
      kakaoClientId: process.env.KAKAO_CLIENT_ID,
      kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI,
      eas: {
        projectId: '42a943ec-d097-4089-b968-8ee6acf648dd',
      },
    },
  },
};
