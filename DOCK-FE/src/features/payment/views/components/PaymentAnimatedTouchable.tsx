import React from 'react';
import {
  Animated,
  GestureResponderEvent,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { usePressScaleAnimation } from '../hooks/usePressScaleAnimation';

type PaymentAnimatedTouchableVariant = 'button' | 'card';

interface PaymentAnimatedTouchableProps extends TouchableOpacityProps {
  variant?: PaymentAnimatedTouchableVariant;
  wrapperStyle?: StyleProp<ViewStyle>;
}

export function PaymentAnimatedTouchable({
  variant = 'button',
  wrapperStyle,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...touchableProps
}: PaymentAnimatedTouchableProps) {
  const { animatedStyle, handlePressIn, handlePressOut } =
    usePressScaleAnimation(variant === 'card' ? 0.97 : 0.93);

  const mergedPressIn = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        handlePressIn();
      }
      onPressIn?.(event);
    },
    [disabled, handlePressIn, onPressIn],
  );

  const mergedPressOut = React.useCallback(
    (event: GestureResponderEvent) => {
      if (!disabled) {
        handlePressOut();
      }
      onPressOut?.(event);
    },
    [disabled, handlePressOut, onPressOut],
  );

  return (
    <Animated.View style={[wrapperStyle, animatedStyle]}>
      <TouchableOpacity
        {...touchableProps}
        disabled={disabled}
        onPressIn={mergedPressIn}
        onPressOut={mergedPressOut}
        style={touchableProps.style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
