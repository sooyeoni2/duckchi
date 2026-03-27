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

const getHostFromUrl = rawUrl => {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return null;
  }
};

const isLocalHost = host =>
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host === '10.0.2.2';

const resolveAppLinkHost = () => {
  const fromApiBase = getHostFromUrl(process.env.API_BASE_URL);
  if (fromApiBase && !isLocalHost(fromApiBase)) {
    // 왜: 메신저/브라우저에서 받은 https 초대 링크를 앱으로 직접 라우팅하기 위해 앱링크 필터를 등록한다.
    return fromApiBase;
  }

  return process.env.INVITE_LINK_HOST || 'j14c102.p.ssafy.io';
};

const appLinkHost = resolveAppLinkHost();

module.exports = {
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: true,
      googleServicesFile: './google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
               // 왜: 메신저/브라우저에서 받은 https 초대 링크를 앱으로 직접 라우팅하기 위해 앱링크 필터를 등록한다.
              scheme: 'https',
              host: appLinkHost,
              pathPrefix: '/invite',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
          autoVerify: true,
        },
      ],
    },
    ios: {
      ...appJson.expo.ios,
      associatedDomains: [`applinks:${appLinkHost}`],
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL ?? 'http://10.0.2.2:8080',
      inviteBaseUrl: process.env.INVITE_LINK_BASE_URL ?? `https://${appLinkHost}/invite`,
      kakaoClientId: process.env.KAKAO_CLIENT_ID,
      kakaoRedirectUri: process.env.KAKAO_REDIRECT_URI,
      eas: {
        projectId: '42a943ec-d097-4089-b968-8ee6acf648dd',
      },
    },
  },
};

