import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { registerRootComponent } from 'expo';
import { toNotificationMessage } from './src/core/notifications';
import { displayNotificationMessage, handleDisplayedNotificationEvent } from './src/features/notification';
import App from './App';

// background data-only 메시지는 앱이 닫혀 있어도 로컬 알림으로 재표시할 수 있다.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  if (remoteMessage.notification != null) {
    return;
  }

  await displayNotificationMessage(toNotificationMessage(remoteMessage));
});

// background에서 Notifee 액션 버튼을 눌렀을 때 같은 알림 라우팅 로직으로 연결한다.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  handleDisplayedNotificationEvent(type, detail);
});

registerRootComponent(App);
