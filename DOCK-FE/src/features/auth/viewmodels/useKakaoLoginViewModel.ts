import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { WebViewNavigation } from 'react-native-webview';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  KAKAO_CLIENT_ID,
  KAKAO_WEB_REDIRECT_URI,
} from '@core/constants/apiConstants';
import { kakaoLogin } from '../models/authService';
import { saveTokenToStorage, useAuthStore } from '../models/authStore';
import type { AuthStackParamList } from '@core/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'KakaoLogin'>;

const extractCode = (url: string): string | null => {
  const match = url.match(/[?&]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const extractError = (url: string): string | null => {
  const match = url.match(/[?&]error=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const isRedirectUrl = (url: string): boolean => {
  if (!KAKAO_WEB_REDIRECT_URI) return false;
  return url.startsWith(KAKAO_WEB_REDIRECT_URI);
};

export const useKakaoLoginViewModel = (navigation: Navigation) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const handledRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!KAKAO_CLIENT_ID || !KAKAO_WEB_REDIRECT_URI) {
      Alert.alert(
        '설정 오류',
        'KAKAO_CLIENT_ID 또는 KAKAO_WEB_REDIRECT_URI가 비어있습니다. .env 설정을 확인해주세요.',
        [{ text: '확인', onPress: () => navigation.goBack() }],
      );
    }
  }, [navigation]);

  const submitKakaoCode = useCallback(
    async (authorizationCode: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      setSubmitting(true);
      try {
        const result = await kakaoLogin({
          authorizationCode,
          redirectUri: KAKAO_WEB_REDIRECT_URI,
        });
        const { isNewUser, user } = result;
        setAuth(result.accessToken, result.refreshToken, user);
        await saveTokenToStorage(result.refreshToken, user);
        if (isNewUser || !user.name) {
          navigation.replace('Terms');
        } else if (!user.hasBankAccount) {
          navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
        } else if (!user.hasPayPassword) {
          navigation.getParent()?.navigate('PayPasswordSetup');
        } else {
          navigation.getParent()?.navigate('App');
        }
        // TODO: 백엔드 hasBankAccount, hasPayPassword 필드 추가 후 위 분기 정상 동작
      } catch (e: any) {
        handledRef.current = false;
        const status = e?.response?.status;
        const data = e?.response?.data;
        let detail: string | null = null;
        if (typeof data === 'string') {
          detail = data;
        } else if (data?.message) {
          detail = data.message;
        } else if (data) {
          try { detail = JSON.stringify(data); } catch { detail = null; }
        }
        if (!detail && e?.message) detail = e.message;
        const message = detail
          ? `${detail}${status ? ` (HTTP ${status})` : ''}`
          : `로그인에 실패했습니다. 다시 시도해 주세요.${status ? ` (HTTP ${status})` : ''}`;
        Alert.alert('로그인 실패', message, [{ text: '확인', onPress: () => navigation.goBack() }]);
      } finally {
        setSubmitting(false);
      }
    },
    [navigation, setAuth],
  );

  const handleShouldStartLoadWithRequest = useCallback(
    (request: WebViewNavigation) => {
      const { url } = request;
      if (isRedirectUrl(url)) {
        const code = extractCode(url);
        if (code) {
          submitKakaoCode(code);
        } else {
          const error = extractError(url);
          if (error) {
            Alert.alert('로그인 취소', '로그인이 취소되었습니다.', [
              { text: '확인', onPress: () => navigation.goBack() },
            ]);
          }
        }
        return false;
      }
      return true;
    },
    [navigation, submitKakaoCode],
  );

  return { submitting, handleShouldStartLoadWithRequest };
};
