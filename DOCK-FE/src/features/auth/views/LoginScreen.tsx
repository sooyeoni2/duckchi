import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { state, openKakaoLogin, resetError } = useLoginViewModel();

  const handleKakaoLogin = () => openKakaoLogin();

  const handleGoogleLogin = () => {
    Alert.alert('준비 중', '구글 로그인은 준비 중입니다.');
  };

  const handleTestLogin = () => {
    // TODO: 테스트 로그인 구현
  };

  React.useEffect(() => {
    if (state.status === 'error') {
      Alert.alert('로그인 실패', state.message, [{ text: '확인', onPress: resetError }]);
    }
    if (state.status === 'success') {
      navigation.getParent()?.navigate('App');
    }
  }, [state]);


  return (
    <View style={styles.container}>

      {/* 상단: 타이틀 */}
      <View style={styles.topSection}>
        <Text style={styles.title}>로그인</Text>
      </View>

      {/* 중간: 연노란 아치 + 버튼 */}
      <View style={styles.middleSection}>
        <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin} activeOpacity={0.85}>
          <KakaoIcon />
          <Text style={styles.kakaoText}>카카오 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} activeOpacity={0.85}>
          <GoogleIcon />
          <Text style={styles.googleText}>구글 로그인</Text>
        </TouchableOpacity>
      </View>

      {/* 하단: 노란 섹션 */}
      <View style={styles.bottomSection}>
        <View style={styles.bowTieRow}>
          <View style={styles.bowTieLeft} />
          <View style={styles.bowTieRight} />
        </View>

        <TouchableOpacity style={styles.testButton} onPress={handleTestLogin} activeOpacity={0.85}>
          <Text style={styles.testText}>테스트 로그인</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const KakaoIcon = () => (
  <View style={icon.kakao}>
    <View style={icon.tail} />
  </View>
);

const GoogleIcon = () => (
  <View style={icon.google}>
    <View style={[icon.block, { backgroundColor: '#EA4335', top: 0, left: 0 }]} />
    <View style={[icon.block, { backgroundColor: '#FBBC05', bottom: 0, left: 0 }]} />
    <View style={[icon.block, { backgroundColor: '#34A853', bottom: 0, right: 0 }]} />
    <View style={[icon.block, { backgroundColor: '#4285F4', top: 0, right: 0 }]} />
  </View>
);

const icon = StyleSheet.create({
  kakao:  { width: 22, height: 20, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 10 },
  tail:   { position: 'absolute', bottom: -4, left: 6, width: 8, height: 6, backgroundColor: 'rgba(0,0,0,0.85)', borderBottomLeftRadius: 4 },
  google: { width: 20, height: 20 },
  block:  { position: 'absolute', width: 10, height: 10 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },

  /* 상단 — 타이틀 영역 (220/917 = 24%) */
  topSection: {
    flex: 2.4,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '10%',
  },
  title: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 40, color: AppColorStyles.black }),
  },

  /* 중간 — 아치 배경 + 버튼 (384/917 = 42%) */
  middleSection: {
    flex: 4.2,
    backgroundColor: '#FFF6C0',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: '14%',
    paddingBottom: '5%',
  },

  kakaoButton: {
    width: '100%',
    height: 54,
    backgroundColor: '#FEE500',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  kakaoText: {
    flex: 1,
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({ fontSize: 18, color: AppColorStyles.black }),
  },

  googleButton: {
    width: '100%',
    height: 54,
    backgroundColor: AppColorStyles.white,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  googleText: {
    flex: 1,
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({ fontSize: 18, color: AppColorStyles.black }),
  },

  /* 하단 — 노란 섹션 (313/917 = 34%) */
  bottomSection: {
    flex: 3.4,
    backgroundColor: '#FEEC7E',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },

  bowTieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bowTieLeft: {
    width: 0, height: 0,
    borderTopWidth: 38, borderBottomWidth: 38, borderLeftWidth: 62,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FE7D04',
  },
  bowTieRight: {
    width: 0, height: 0,
    borderTopWidth: 38, borderBottomWidth: 38, borderRightWidth: 62,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: '#FE7D04',
  },

  testButton: {
    width: '80%',
    height: 54,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.black,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 18, color: AppColorStyles.black }),
  },
});

export default LoginScreen;
