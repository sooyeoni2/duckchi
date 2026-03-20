import React from 'react';
import { Animated } from 'react-native';

export function usePressScaleAnimation(pressedScale: number) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = React.useCallback(() => {
    Animated.spring(scale, {
      toValue: pressedScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [pressedScale, scale]);

  const handlePressOut = React.useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scale]);

  return {
    animatedStyle: {
      transform: [{ scale }],
    },
    handlePressIn,
    handlePressOut,
  };
}
