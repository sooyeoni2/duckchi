import React from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';

interface ShimmerBlockProps {
  width: number | `${number}%` | 'auto';
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  minOpacity?: number;
  maxOpacity?: number;
  durationMs?: number;
}

export function ShimmerBlock({
  width,
  height,
  borderRadius = 10,
  style,
  minOpacity = 0.45,
  maxOpacity = 1,
  durationMs = 880,
}: ShimmerBlockProps) {
  const pulse = React.useRef(new Animated.Value(minOpacity)).current;

  React.useEffect(() => {
    pulse.setValue(minOpacity);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: maxOpacity,
          duration: durationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: minOpacity,
          duration: durationMs,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [durationMs, maxOpacity, minOpacity, pulse]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: AppColorStyles.gray3,
  },
});
