import { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { KAKAO_AUTH_URL } from '@core/constants/apiConstants';
import { kakaoLogin } from '../models/authService';
import { useAuthStore } from '../models/authStore';
import type { KakaoLoginResponse } from '../models/authTypes';

type LoginState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; result: KakaoLoginResponse };

const extractCode = (url: string): string | null => {
  const match = url.match(/[?&]code=([^&]+)/);
  return match ? match[1] : null;
};

export const useLoginViewModel = () => {
  const [state, setState] = useState<LoginState>({ status: 'idle' });
  const setAuth = useAuthStore((s) => s.setAuth);

  const submitKakaoCode = async (authorizationCode: string) => {
    setState({ status: 'loading' });
    try {
      const result = await kakaoLogin({ authorizationCode });
      setAuth(result.accessToken, result.refreshToken, result.user);
      setState({ status: 'success', result });
      return result;
    } catch (e: any) {
      const message =
        e?.response?.data?.message ?? '로그인에 실패했습니다. 다시 시도해 주세요.';
      setState({ status: 'error', message });
      return null;
    }
  };

  // 카카오 OAuth 리다이렉트 URL에서 code 추출 (웹: URL 파라미터, 모바일: 딥링크)
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const code = extractCode(url);
      if (code) submitKakaoCode(code);
    };

    // 모바일 딥링크 리스너
    const subscription = Linking.addEventListener('url', handleUrl);

    // 웹: 최초 로드 시 URL에 code가 있으면 처리
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openKakaoLogin = async () => {
    try {
      await Linking.openURL(KAKAO_AUTH_URL);
    } catch {
      setState({ status: 'error', message: '카카오 로그인 페이지를 열 수 없습니다.' });
    }
  };

  const resetError = () => setState({ status: 'idle' });

  return { state, openKakaoLogin, resetError };
};
