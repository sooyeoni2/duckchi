import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { PretendardTextStyle } from '@core/theme/typography';
import { useToastStore, type ToastType } from '../stores/useToastStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const TOAST_COLORS: Record<ToastType, string> = {
  success: AppColorStyles.success || '#4CAF50',
  error: AppColorStyles.warning || '#F44336',
  info: AppColorStyles.black || '#2196F3',
  warning: AppColorStyles.caution || '#FF9800',
};

export const GlobalToast: React.FC = () => {
  const { isVisible, message, type, duration, hideToast } = useToastStore();
  const insets = useSafeAreaInsets();
  
  const [shouldRender, setShouldRender] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: insets.top + (Platform.OS === 'ios' ? 0 : 10),
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start(() => {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);
        return () => clearTimeout(timer);
      });
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isVisible, hideToast, duration, insets.top, opacity, translateY]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: TOAST_COLORS[type],
        },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20 * s,
    right: 20 * s,
    paddingHorizontal: 20 * s,
    paddingVertical: 14 * s,
    borderRadius: 12 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    // Shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    ...PretendardTextStyle.bold({
      fontSize: 15 * s,
      color: AppColorStyles.white || '#FFFFFF',
    }),
    textAlign: 'center',
  },
});
