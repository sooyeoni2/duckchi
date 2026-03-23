import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee from '@notifee/react-native';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  bootstrapNotifications,
  consumeAllNotificationOpens,
  ensureDefaultNotificationChannel,
  requestNotificationDisplayPermission,
  type NotificationMessage,
} from '@core/notifications';
import {
  displayNotificationMessage,
  handleDisplayedNotificationEvent,
  openNotificationEvent,
} from '@features/notification';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AuthNavigator } from './src/core/navigation/AuthNavigator';
import { navigationRef } from './src/core/navigation/navigationRef';
import { RootStackParamList } from './src/core/navigation/types';
import { BankAccountCompleteScreen } from './src/features/bank/views/BankAccountCompleteScreen';
import { BankAccountSetupScreen } from './src/features/bank/views/BankAccountSetupScreen';
import { BankAccountVerifyScreen } from './src/features/bank/views/BankAccountVerifyScreen';
import { PayPasswordConfirmScreen } from './src/features/bank/views/PayPasswordConfirmScreen';
import { PayPasswordInputScreen } from './src/features/bank/views/PayPasswordInputScreen';
import { PayPasswordSetupScreen } from './src/features/bank/views/PayPasswordSetupScreen';
import { useAuthStore } from './src/features/auth/models/authStore';
import { NotificationPlaceholderScreen } from './src/features/notification/views/NotificationPlaceholderScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [fontsLoaded, fontError] = useFonts({
    'KBO Dia Gothic Light': require('./src/assets/fonts/KBO Dia Gothic Light.otf'),
    'KBO Dia Gothic Medium': require('./src/assets/fonts/KBO Dia Gothic Medium.otf'),
    'KBO Dia Gothic Bold': require('./src/assets/fonts/KBO Dia Gothic Bold.otf'),
    'Pretendard-Thin': require('./src/assets/fonts/Pretendard-Thin.ttf'),
    'Pretendard-ExtraLight': require('./src/assets/fonts/Pretendard-ExtraLight.ttf'),
    'Pretendard-Light': require('./src/assets/fonts/Pretendard-Light.ttf'),
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('./src/assets/fonts/Pretendard-ExtraBold.ttf'),
    'Pretendard-Black': require('./src/assets/fonts/Pretendard-Black.ttf'),
  });

  // foreground 수신 시에는 Notifee 로컬 알림을 띄워 액션 버튼까지 같은 UX로 맞춘다.
  const handleForegroundMessage = React.useCallback((message: NotificationMessage) => {
    void displayNotificationMessage(message);
  }, []);

  useEffect(() => {
    let cleanupNotifications: (() => void) | undefined;
    let isUnmounted = false;

    // Notifee 표시를 쓰려면 권한과 기본 채널을 먼저 준비해둔다.
    void requestNotificationDisplayPermission()
      .then(() => ensureDefaultNotificationChannel())
      .then(() =>
        bootstrapNotifications({
          onForegroundMessage: handleForegroundMessage,
          onNotificationOpen: async (event) => {
            openNotificationEvent(event);
          },
        }),
      )
      .then((cleanup) => {
        if (isUnmounted) {
          cleanup();
          return;
        }

        cleanupNotifications = cleanup;
      });

    // foreground에서 로컬 알림 본문이나 액션 버튼을 누른 경우도 같은 라우팅 로직에 연결한다.
    const unsubscribeForegroundEvent = notifee.onForegroundEvent(({ type, detail }) => {
      handleDisplayedNotificationEvent(type, detail);
    });

    return () => {
      isUnmounted = true;
      unsubscribeForegroundEvent();
      cleanupNotifications?.();
    };
  }, [handleForegroundMessage]);

  // 푸시 탭으로 앱이 열렸을 때 네비게이션 준비 전에 쌓인 이벤트를 화면 준비 직후 다시 처리한다.
  const handleNavigationReady = React.useCallback(() => {
    const pendingEvents = consumeAllNotificationOpens();

    pendingEvents.forEach((event) => {
      openNotificationEvent(event);
    });
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F5" />
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'none' }}
          initialRouteName={isLoggedIn ? 'App' : 'Onboarding'}
        >
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onStart={() => navigation.replace('Auth')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen name="NotificationPlaceholder" component={NotificationPlaceholderScreen} />
          <Stack.Screen name="BankAccountSetup" component={BankAccountSetupScreen} />
          <Stack.Screen name="BankAccountVerify" component={BankAccountVerifyScreen} />
          <Stack.Screen name="BankAccountComplete" component={BankAccountCompleteScreen} />
          <Stack.Screen name="PayPasswordSetup" component={PayPasswordSetupScreen} />
          <Stack.Screen name="PayPasswordConfirm" component={PayPasswordConfirmScreen} />
          <Stack.Screen name="PayPasswordInput" component={PayPasswordInputScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
