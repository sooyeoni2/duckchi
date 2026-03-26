import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { Alert, Linking, StatusBar } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadTokenFromStorage, useAuthStore } from './src/features/auth/models/authStore';
import { axiosClient } from './src/core/network/axiosClient';
import { ENDPOINTS } from './src/core/constants/apiConstants';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AuthNavigator } from './src/core/navigation/AuthNavigator';
import { navigationRef } from './src/core/navigation/navigationRef';
import { RootStackParamList } from './src/core/navigation/types';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { validateInviteLink } from './src/features/room/models/roomService';

import { BankAccountSetupScreen } from './src/features/bank/views/BankAccountSetupScreen';
import { BankAccountVerifyScreen } from './src/features/bank/views/BankAccountVerifyScreen';
import { BankAccountCompleteScreen } from './src/features/bank/views/BankAccountCompleteScreen';
import { PayPasswordSetupScreen } from './src/features/bank/views/PayPasswordSetupScreen';
import { PayPasswordConfirmScreen } from './src/features/bank/views/PayPasswordConfirmScreen';
import { PayPasswordInputScreen } from './src/features/bank/views/PayPasswordInputScreen';

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
    restoreAuth();
  }, []);

  useEffect(() => {
    // 앱이 foreground 상태일 때는 시스템 알림 배너 대신 즉시 사용자에게 내용을 보여준다.
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      const title = remoteMessage.notification?.title ?? '새 알림';
      const body = remoteMessage.notification?.body ?? '도착한 알림을 확인해 주세요.';

      Alert.alert(title, body);
    });

    return unsubscribe;
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
      <NavigationContainer ref={navigationRef} onReady={() => setIsNavigationReady(true)}>
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
    </SafeAreaProvider>
  );
}

export default App;
