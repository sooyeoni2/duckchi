import React from 'react';
import { Animated, Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../core/theme/typography';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const DESIGN_WIDTH = 412;
const DESIGN_HEIGHT = 917;
const sx = SCREEN_WIDTH / DESIGN_WIDTH;
const sy = SCREEN_HEIGHT / DESIGN_HEIGHT;

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duckchi</Text>

      <Image
        source={require('../../assets/images/duckchi_character.png')}
        style={styles.character}
        resizeMode="contain"
      />

      <Animated.View style={[styles.buttonWrap, { transform: [{ scale }] }]}>
        <Pressable style={styles.button} onPress={onStart} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Text style={styles.buttonText}>시작하기</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
    overflow: 'hidden',
  },
  title: {
    position: 'absolute',
    left: 97 * sx,
    top: 134 * sy,
    width: 219 * sx,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 40 * sx,
      color: AppColorStyles.black,
      lineHeight: 40 * sx,
    }),
    textAlign: 'center',
  },
  character: {
    position: 'absolute',
    left: -39 * sx,
    top: 214 * sy,
    width: 489 * sx,
    height: 489 * sx,
  },
  buttonWrap: {
    position: 'absolute',
    left: 42 * sx,
    top: 740 * sy,
    width: 328 * sx,
    height: 60 * sy,
  },
  button: {
    flex: 1,
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * sx,
      color: AppColorStyles.black,
    }),
    textAlign: 'center',
  },
});
