import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const handleKakaoLogin = () => {
    navigation.navigate('KakaoLogin');
  };
  const handleTestLogin = () => {};

  return (
    <View style={styles.container}>
      <View style={styles.archBg} />
      <View style={styles.yellowBg} />

      <Text style={styles.title}>로그인</Text>

      <View style={styles.eyeLeft} />
      <View style={styles.eyeLeftHL} />
      <View style={styles.eyeRight} />
      <View style={styles.eyeRightHL} />

      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin} activeOpacity={0.85}>
        <KakaoIcon />
        <Text style={styles.kakaoText}>카카오 로그인</Text>
      </TouchableOpacity>

      <View style={styles.bowTieRow}>
        <View style={styles.bowTieLeft} />
        <View style={styles.bowTieRight} />
      </View>

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

  archBg: {
    position: 'absolute',
    width: '100%',
    height: '69.6%',
    top: '24%',
    backgroundColor: '#FFF6C0',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  yellowBg: {
    position: 'absolute',
    width: '105%',
    height: '37.5%',
    left: 0,
    bottom: 0,
    backgroundColor: '#FEEC7E',
  },

  title: {
    position: 'absolute',
    width: '53.2%',
    left: '23.5%',
    top: '14.6%',
    textAlign: 'center',
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: AppColorStyles.black }),
  },

  eyeLeft: {
    position: 'absolute',
    width: 22 * s,
    height: 44 * s,
    left: '33.7%',
    top: '37.3%',
    backgroundColor: '#000000',
    borderRadius: 1000,
  },
  eyeLeftHL: {
    position: 'absolute',
    width: 9 * s,
    height: 21 * s,
    left: '34.2%',
    top: '37.9%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
  },

  eyeRight: {
    position: 'absolute',
    width: 22 * s,
    height: 44 * s,
    left: '61.7%',
    top: '37.3%',
    backgroundColor: '#000000',
    borderRadius: 1000,
  },
  eyeRightHL: {
    position: 'absolute',
    width: 9 * s,
    height: 21 * s,
    left: '62.1%',
    top: '37.9%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
  },

  kakaoButton: {
    position: 'absolute',
    width: '71.8%',
    height: 54,
    left: '14.3%',
    top: '52.9%',
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

  bowTieRow: {
    position: 'absolute',
    flexDirection: 'row',
    left: '31.6%',
    top: '67.3%',
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

  testButton: {
    position: 'absolute',
    width: '79.6%',
    height: 60,
    left: '10.2%',
    top: '88.3%',
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
