import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { state, openKakaoLogin, resetError } = useLoginViewModel();

  const handleKakaoLogin = () => openKakaoLogin();
  const handleTestLogin  = () => {};

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

      {/* ── 배경 ── */}
      <View style={styles.archBg} />
      <View style={styles.yellowBg} />

      {/* ── 타이틀 ── */}
      <Text style={styles.title}>로그인</Text>

      {/* ── 눈 ── */}
      <View style={styles.eyeLeft} />
      <View style={styles.eyeLeftHL} />
      <View style={styles.eyeRight} />
      <View style={styles.eyeRightHL} />

      {/* ── 카카오 버튼 ── */}
      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin} activeOpacity={0.85}>
        <KakaoIcon />
        <Text style={styles.kakaoText}>카카오 로그인</Text>
      </TouchableOpacity>

      {/* ── 나비넥타이 (Group 329) ── */}
      <View style={styles.bowTieRow}>
        <View style={styles.bowTieLeft} />
        <View style={styles.bowTieRight} />
      </View>

      {/* ── 테스트 로그인 ── */}
      <TouchableOpacity style={styles.testButton} onPress={handleTestLogin} activeOpacity={0.85}>
        <Text style={styles.testText}>테스트 로그인</Text>
      </TouchableOpacity>

    </View>
  );
};

const KakaoIcon = () => (
  <View style={icon.bubble}>
    <View style={icon.tail} />
  </View>
);

const icon = StyleSheet.create({
  bubble: { width: 22 * s, height: 20 * s, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 10 * s },
  tail:   { position: 'absolute', bottom: -4 * s, left: 6 * s, width: 8 * s, height: 6 * s, backgroundColor: 'rgba(0,0,0,0.85)', borderBottomLeftRadius: 4 * s },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },

  /* ── 배경 ── */
  archBg: {
    position: 'absolute',
    width: '100%',
    height: '69.6%',     // 638 / 917
    top: '24%',          // 220 / 917
    backgroundColor: '#FFF6C0',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  yellowBg: {
    position: 'absolute',
    width: '105%',
    height: '37.5%',     // 344 / 917
    left: 0,
    bottom: 0,
    backgroundColor: '#FEEC7E',
  },

  /* ── 타이틀 ── */
  title: {
    position: 'absolute',
    width: '53.2%',      // 219 / 412
    left: '23.5%',       // 97 / 412
    top: '14.6%',        // 134 / 917
    textAlign: 'center',
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: AppColorStyles.black }),
  },

  /* ── 눈 — Ellipse 79 / 81 (왼쪽) ── */
  eyeLeft: {
    position: 'absolute',
    width: 22 * s,
    height: 44 * s,
    left: '33.7%',       // 139 / 412
    top: '37.3%',        // 342 / 917
    backgroundColor: '#000000',
    borderRadius: 1000,
  },
  eyeLeftHL: {
    position: 'absolute',
    width: 9 * s,
    height: 21 * s,
    left: '34.2%',       // 141 / 412
    top: '37.9%',        // 348 / 917
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
  },

  /* ── 눈 — Ellipse 82 / 83 (오른쪽) ── */
  eyeRight: {
    position: 'absolute',
    width: 22 * s,
    height: 44 * s,
    left: '61.7%',       // 254 / 412
    top: '37.3%',
    backgroundColor: '#000000',
    borderRadius: 1000,
  },
  eyeRightHL: {
    position: 'absolute',
    width: 9 * s,
    height: 21 * s,
    left: '62.1%',       // 256 / 412
    top: '37.9%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
  },

  /* ── 카카오 버튼 ── */
  kakaoButton: {
    position: 'absolute',
    width: '71.8%',      // 296 / 412
    height: 54,
    left: '14.3%',       // 59 / 412
    top: '52.9%',        // 485 / 917
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
    ...KBODiaGothicTextStyle.medium({ fontSize: 18 * s, color: AppColorStyles.black }),
  },

  /* ── 나비넥타이 ── */
  bowTieRow: {
    position: 'absolute',
    flexDirection: 'row',
    left: '31.6%',       // 130 / 412
    top: '67.3%',        // 617 / 917
  },
  bowTieLeft: {
    width: 0, height: 0,
    borderTopWidth: 40 * s, borderBottomWidth: 40 * s, borderLeftWidth: 65 * s,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FE7D04',
  },
  bowTieRight: {
    width: 0, height: 0,
    borderTopWidth: 40 * s, borderBottomWidth: 40 * s, borderRightWidth: 65 * s,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: '#FE7D04',
  },

  /* ── 테스트 로그인 버튼 ── */
  testButton: {
    position: 'absolute',
    width: '79.6%',      // 328 / 412
    height: 60,
    left: '10.2%',       // 42 / 412
    top: '88.3%',        // 810 / 917
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.black,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 18 * s, color: AppColorStyles.black }),
  },
});

export default LoginScreen;
