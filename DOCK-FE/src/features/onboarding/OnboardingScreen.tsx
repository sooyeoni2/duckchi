import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duckchi</Text>

      <Image
        source={require('../../assets/images/duckchi_character.png')}
        style={styles.character}
        resizeMode="contain"
      />

      <TouchableOpacity style={styles.button} onPress={onStart} activeOpacity={0.8}>
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
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
  button: {
    position: 'absolute',
    left: 42 * sx,
    top: 740 * sy,
    width: 328 * sx,
    height: 60 * sy,
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
