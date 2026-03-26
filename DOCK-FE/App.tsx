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
  logNotificationDebugState,
  requestNotificationDisplayPermission,
  type NotificationMessage,
} from '@core/notifications';
import {
  displayNotificationMessage,
  handleDisplayedNotificationEvent,
  InAppNotificationBanner,
  openNotificationMessage,
  openNotificationEvent,
} from '@features/notification';
import { loadTokenFromStorage, useAuthStore } from './src/features/auth/models/authStore';
import { axiosClient } from './src/core/network/axiosClient';
import { ENDPOINTS } from './src/core/constants/apiConstants';
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
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateAccessToken = useAuthStore((s) => s.updateAccessToken);
  const [authReady, setAuthReady] = React.useState(false);
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
  const [foregroundBannerMessage, setForegroundBannerMessage] = React.useState<NotificationMessage | null>(null);
  const foregroundBannerTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const stored = await loadTokenFromStorage();
        if (stored) {
          const res = await axiosClient.post(ENDPOINTS.auth.refresh, { refreshToken: stored.refreshToken });
          const newAccessToken: string = res.data.data.accessToken;
          updateAccessToken(newAccessToken);
          setAuth(newAccessToken, stored.refreshToken, stored.user);
        }
      } catch {
        // 토큰 만료 등 복원 실패 시 로그인 화면으로
      } finally {
        setAuthReady(true);
      }
    };
    restoreAuth().catch(() => {
      setAuthReady(true);
    });
  }, [setAuth, updateAccessToken]);

  // foreground 수신 시에는 Notifee 로컬 알림을 띄워 액션 버튼까지 같은 UX로 맞춘다.
  const handleForegroundMessage = React.useCallback((message: NotificationMessage) => {
    // foreground에서는 OS 배너 외에 인앱 배너도 항상 보여준다.
    setForegroundBannerMessage(message);

    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
    }

    foregroundBannerTimerRef.current = setTimeout(() => {
      setForegroundBannerMessage(null);
      foregroundBannerTimerRef.current = null;
    }, 4500);

    if (false) displayNotificationMessage(message).catch(() => {
      // 알림 표시 실패는 앱 흐름을 막지 않는다.
    });
  }, []);

  useEffect(() => {
    let cleanupNotifications: (() => void) | undefined;
    let isUnmounted = false;

    // Notifee 표시를 쓰려면 권한과 기본 채널을 먼저 준비해둔다.
    const initializeNotifications = async () => {
      const cleanup = await requestNotificationDisplayPermission()
        .then(() => ensureDefaultNotificationChannel())
        .then(() => logNotificationDebugState())
        .then(() =>
          bootstrapNotifications({
            onForegroundMessage: handleForegroundMessage,
            onNotificationOpen: async (event) => {
              openNotificationEvent(event);
            },
          }),
        );

      if (isUnmounted) {
        cleanup();
        return;
      }

      cleanupNotifications = cleanup;
    };

    initializeNotifications().catch(() => {
      // 알림 초기화 실패는 앱 진입을 막지 않는다.
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

  const handleForegroundBannerPress = React.useCallback(() => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }

    if (foregroundBannerMessage != null) {
      openNotificationMessage(foregroundBannerMessage);
    }

    setForegroundBannerMessage(null);
  }, [foregroundBannerMessage]);

  const handleForegroundBannerClose = React.useCallback(() => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }

    setForegroundBannerMessage(null);
  }, []);

  useEffect(() => () => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }
  }, []);

  if (!fontsLoaded && !fontError) return null;
  if (!authReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F5" />
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'none' }}
          initialRouteName="Onboarding"
        >
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onStart={() => navigation.replace(isLoggedIn ? 'App' : 'Auth')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen name="BankAccountSetup" component={BankAccountSetupScreen} />
          <Stack.Screen name="BankAccountVerify" component={BankAccountVerifyScreen} />
          <Stack.Screen name="BankAccountComplete" component={BankAccountCompleteScreen} />
          <Stack.Screen name="PayPasswordSetup" component={PayPasswordSetupScreen} />
          <Stack.Screen name="PayPasswordConfirm" component={PayPasswordConfirmScreen} />
          <Stack.Screen name="PayPasswordInput" component={PayPasswordInputScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <InAppNotificationBanner
        visible={foregroundBannerMessage != null}
        title={foregroundBannerMessage?.title}
        body={foregroundBannerMessage?.body}
        onPress={handleForegroundBannerPress}
        onClose={handleForegroundBannerClose}
      />
    </SafeAreaProvider>
  );
}

export default App;
