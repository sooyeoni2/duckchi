import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');
const s = W / 412;
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { AuthStackParamList } from '@core/navigation/types';

import duckCharacter from '../../../assets/images/duckchi_character.png';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const handleKakaoLogin = () => {
    navigation.navigate('KakaoLogin');
  };

  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.topSection} edges={['top']}>
        <View style={styles.textGroup}>
          <Text style={styles.appName}>로그인</Text>
          <Text style={styles.tagline}>더치페이, 더 쉽게</Text>
        </View>
        <Image source={duckCharacter} style={styles.character} resizeMode="contain" />
      </SafeAreaView>

      <View style={styles.bottomArea}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Pressable
            style={styles.kakaoButton}
            onPress={handleKakaoLogin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <View style={styles.kakaoIconWrap}>
              <KakaoIcon />
            </View>
            <Text style={styles.kakaoText}>카카오 로그인</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

const KakaoIcon = () => (
  <MaterialCommunityIcons name="chat" size={24} color="#1A1A1A" />
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5A0',
  },

  topSection: {
    height: H * 0.68,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 32,
  },
  textGroup: {
    alignItems: 'center',
    height: H * 0.22,
    justifyContent: 'flex-end',
    paddingBottom: H * 0.04,
  },
  appName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 40 * s, color: AppColorStyles.black }),
    marginBottom: 4,
  },
  tagline: {
    ...KBODiaGothicTextStyle.light({ fontSize: 15 * s, color: AppColorStyles.black }),
    opacity: 0.5,
  },
  character: {
    width: 300,
    height: 300,
  },

  bottomArea: {
    flex: 1,
    paddingHorizontal: 48,
    paddingTop: 24,
  },
  bottomCard: {
    backgroundColor: AppColorStyles.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 26, color: AppColorStyles.black }),
    marginBottom: 8,
  },
  subText: {
    ...KBODiaGothicTextStyle.light({ fontSize: 14, color: AppColorStyles.textHint }),
    marginBottom: 28,
  },

  kakaoButton: {
    height: 54,
    backgroundColor: '#FEE500',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  kakaoIconWrap: {
    position: 'absolute',
    left: 20,
  },
  kakaoText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 17, color: AppColorStyles.black }),
  },
});

export default LoginScreen;
