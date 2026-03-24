import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import WebView from 'react-native-webview';
import { KAKAO_WEB_AUTH_URL } from '@core/constants/apiConstants';
import { useKakaoLoginViewModel } from '../viewmodels/useKakaoLoginViewModel';
import type { AuthStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'KakaoLogin'>;

const KakaoLoginWebViewScreen: React.FC<Props> = ({ navigation }) => {
  const { submitting, handleShouldStartLoadWithRequest } = useKakaoLoginViewModel(navigation);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: KAKAO_WEB_AUTH_URL }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        incognito
        cacheEnabled={false}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
      />
      {submitting && (
        <View style={styles.submitting}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  submitting: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
});

export default KakaoLoginWebViewScreen;
