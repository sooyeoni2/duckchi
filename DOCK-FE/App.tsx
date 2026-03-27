import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import notifee from '@notifee/react-native';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { Alert, Linking, StatusBar } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  bootstrapNotifications,
  consumeAllNotificationOpens,
  ensureDefaultNotificationChannel,
  logNotificationDebugState,
  requestNotificationDisplayPermission,
  syncNotificationToken,
  type NotificationMessage,
} from '@core/notifications';
import {
  displayNotificationMessage,
  getAppNotification,
  getForegroundNotificationActions,
  handleDisplayedNotificationEvent,
  InAppNotificationBanner,
  openNotificationAction,
  openNotificationMessage,
  openNotificationEvent,
  type NotificationAction,
} from '@features/notification';
import { loadTokenFromStorage, useAuthStore } from './src/features/auth/models/authStore';
import { axiosClient } from './src/core/network/axiosClient';
import { ENDPOINTS } from './src/core/constants/apiConstants';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AuthNavigator } from './src/core/navigation/AuthNavigator';
import { navigationRef } from './src/core/navigation/navigationRef';
import { RootStackParamList } from './src/core/navigation/types';
import { validateInviteLink } from './src/features/room/models/roomService';

import { resetBadgeStore } from './src/features/profile/viewmodels/useBadgeViewModel';
import { resetProfileStore } from './src/features/profile/viewmodels/useProfileViewModel';
import { BankAccountCompleteScreen } from './src/features/bank/views/BankAccountCompleteScreen';
import { BankAccountSetupScreen } from './src/features/bank/views/BankAccountSetupScreen';
import { BankAccountVerifyScreen } from './src/features/bank/views/BankAccountVerifyScreen';
import { PayPasswordConfirmScreen } from './src/features/bank/views/PayPasswordConfirmScreen';
import { PayPasswordInputScreen } from './src/features/bank/views/PayPasswordInputScreen';
import { PayPasswordSetupScreen } from './src/features/bank/views/PayPasswordSetupScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { GlobalToast } from './src/shared/components/GlobalToast';

const Stack = createNativeStackNavigator<RootStackParamList>();

const parseInviteTokenFromUrl = (url: string): string | null => {
  const target = url.trim();
  if (!target) {
    return null;
  }

  const directMatch = target.match(/^duckchi:\/\/invite\/([^/?#]+)/i);
  if (directMatch?.[1]) {
    return decodeURIComponent(directMatch[1]);
  }

  const webMatch = target.match(/\/invite\/([^/?#]+)/i);
  if (webMatch?.[1]) {
    return decodeURIComponent(webMatch[1]);
  }

  return null;
};

const toApiErrorMessage = (error: any, fallback: string): string =>
  error?.response?.data?.msg ??
  error?.response?.data?.message ??
  fallback;

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateAccessToken = useAuthStore((s) => s.updateAccessToken);
  const [authReady, setAuthReady] = React.useState(false);
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);
  const [pendingInviteToken, setPendingInviteToken] = React.useState<string | null>(null);
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
  const [foregroundBannerActions, setForegroundBannerActions] = React.useState<NotificationAction[]>([]);
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
    const title = message.title ?? '알림';
    const body = message.body ?? '';
    const isNotificationSetupInfoMessage =
      title.includes('알림 설정') || body.includes('알림이 설정되었습니다');

    if (isNotificationSetupInfoMessage) {
      return;
    }

    if (title === '뱃지 획득') {
      resetBadgeStore();
      resetProfileStore();
      Alert.alert(title, body);
    }

    // foreground에서는 OS 배너 외에 인앱 배너도 항상 보여준다.
    setForegroundBannerMessage(message);

    const appNotification = getAppNotification(message);
    const shouldShowForegroundActions =
      appNotification?.type === 'SETTLEMENT_REQUEST' &&
      appNotification.isAgreed === true &&
      (appNotification.settlementIds?.length ?? 0) > 0;

    setForegroundBannerActions(
      shouldShowForegroundActions ? getForegroundNotificationActions(message) : [],
    );

    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
    }

    foregroundBannerTimerRef.current = setTimeout(() => {
      setForegroundBannerMessage(null);
      setForegroundBannerActions([]);
      foregroundBannerTimerRef.current = null;
    }, 4500);

    if (false) displayNotificationMessage(message).catch(() => {
      // 알림 표시 실패는 앱 흐름을 막지 않는다.
    });
  }, []);

  useEffect(() => {
    if (!authReady || !isLoggedIn) {
      return;
    }

    const syncWithReason = async (reason: string, refreshedToken?: string) => {
      try {
        await syncNotificationToken(refreshedToken);
        console.log('[FCM SYNC] completed', { reason });
      } catch (error) {
        console.warn('[FCM SYNC] failed', { reason, error });
      }
    };

    syncWithReason('login_or_auth_restore').catch(() => undefined);

    const unsubscribeTokenRefresh = messaging().onTokenRefresh((refreshedToken) => {
      syncWithReason('on_token_refresh', refreshedToken).catch(() => undefined);
    });

    return () => {
      unsubscribeTokenRefresh();
    };
  }, [authReady, isLoggedIn]);

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
    setForegroundBannerActions([]);
  }, [foregroundBannerMessage]);

  const handleForegroundBannerClose = React.useCallback(() => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }

    setForegroundBannerMessage(null);
    setForegroundBannerActions([]);
  }, []);

  const handleForegroundBannerActionPress = React.useCallback((action: NotificationAction) => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }

    openNotificationAction(action);
    setForegroundBannerMessage(null);
    setForegroundBannerActions([]);
  }, []);

  useEffect(() => () => {
    if (foregroundBannerTimerRef.current != null) {
      clearTimeout(foregroundBannerTimerRef.current);
      foregroundBannerTimerRef.current = null;
    }
  }, []);

  const enqueueInviteTokenFromUrl = React.useCallback((url: string | null) => {
    if (!url) {
      return;
    }
    const token = parseInviteTokenFromUrl(url);
    if (token) {
      setPendingInviteToken(token);
    }
  }, []);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    let isMounted = true;

    const resolveInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (!isMounted) {
        return;
      }
      enqueueInviteTokenFromUrl(url);
    };

    void resolveInitialUrl();

    const subscription = Linking.addEventListener('url', (event) => {
      enqueueInviteTokenFromUrl(event.url);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [authReady, enqueueInviteTokenFromUrl]);

  useEffect(() => {
    if (!authReady || !isNavigationReady || !pendingInviteToken || !isLoggedIn) {
      return;
    }

    let cancelled = false;

    const processInviteEntry = async () => {
      try {
        const preview = await validateInviteLink(pendingInviteToken);

        if (cancelled) {
          return;
        }

        if (preview.valid !== true || preview.roomId <= 0) {
          Alert.alert('초대 링크 오류', '유효하지 않은 초대 링크입니다.');
          return;
        }

        if (preview.alreadyParticipant) {
          // 왜: 이미 참여자면 동의 화면을 다시 거치지 않고 바로 모임 상세로 보내는 것이 요구사항에 맞다.
          navigationRef.navigate('App', {
            screen: 'Room',
            params: {
              screen: 'RoomDetail',
              params: { roomId: preview.roomId },
            },
          });
          return;
        }

        navigationRef.navigate('App', {
          screen: 'Room',
          params: {
            screen: 'AutoTransferJoin',
            params: {
              roomId: preview.roomId,
              roomName: preview.roomName,
              inviteToken: pendingInviteToken,
            },
          },
        });
      } catch (error: any) {
        if (cancelled) {
          return;
        }
        Alert.alert(
          '초대 링크 오류',
          toApiErrorMessage(error, '초대 링크를 확인할 수 없습니다.'),
        );
      } finally {
        if (!cancelled) {
          setPendingInviteToken(null);
        }
      }
    };

    void processInviteEntry();

    return () => {
      cancelled = true;
    };
  }, [authReady, isLoggedIn, isNavigationReady, pendingInviteToken]);

  if (!fontsLoaded && !fontError) return null;
  if (!authReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F5" />
      <NavigationContainer ref={navigationRef} onReady={() => {
        setIsNavigationReady(true);
        handleNavigationReady();
        }}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'fade' }}
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
        actions={foregroundBannerActions}
        onPress={handleForegroundBannerPress}
        onClose={handleForegroundBannerClose}
        onActionPress={handleForegroundBannerActionPress}
      />
      <GlobalToast />
    </SafeAreaProvider>
  );
}

export default App;
