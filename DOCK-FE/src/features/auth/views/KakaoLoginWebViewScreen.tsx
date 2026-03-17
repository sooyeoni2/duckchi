import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import type { WebViewNavigation } from 'react-native-webview';
import {
  KAKAO_CLIENT_ID,
  KAKAO_WEB_AUTH_URL,
  KAKAO_WEB_REDIRECT_URI,
} from '@core/constants/apiConstants';
import { kakaoLogin } from '../models/authService';
import { useAuthStore } from '../models/authStore';
import type { AuthStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'KakaoLogin'>;

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

const KakaoLoginWebViewScreen: React.FC<Props> = ({ navigation }) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const handledRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!KAKAO_CLIENT_ID || !KAKAO_WEB_REDIRECT_URI) {
      Alert.alert(
        '설정 오류',
        'KAKAO_CLIENT_ID 또는 KAKAO_WEB_REDIRECT_URI가 비어있습니다. .env 설정을 확인해주세요.',
        [{ text: '확인', onPress: () => navigation.goBack() }]
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
        setAuth(result.accessToken, result.refreshToken, result.user);
        if (result.isNewUser) {
          navigation.replace('Terms');
        } else {
          navigation.getParent()?.navigate('App');
        }
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
          try {
            detail = JSON.stringify(data);
          } catch {
            detail = null;
          }
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
    [navigation, setAuth]
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
    [navigation, submitKakaoCode]
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: KAKAO_WEB_AUTH_URL }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
      {submitting ? (
        <View style={styles.submitting}>
          <ActivityIndicator size="large" />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitting: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default KakaoLoginWebViewScreen;


