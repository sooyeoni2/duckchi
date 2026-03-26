import React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

interface InAppNotificationBannerProps {
  visible: boolean;
  title?: string;
  body?: string;
  onPress: () => void;
  onClose: () => void;
}

export function InAppNotificationBanner({
  visible,
  title,
  body,
  onPress,
  onClose,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [displayTitle, setDisplayTitle] = React.useState(title ?? '새 알림');
  const [displayBody, setDisplayBody] = React.useState(body ?? '도착한 알림을 확인해 주세요.');

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    setDisplayTitle(title ?? '새 알림');
    setDisplayBody(body ?? '도착한 알림을 확인해 주세요.');
  }, [body, title, visible]);

  React.useEffect(() => {
    if (visible) {
      setShouldRender(true);
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 170 : 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : -28,
        duration: visible ? 170 : 140,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!visible && finished) {
        setShouldRender(false);
      }
    });
  }, [opacity, translateY, visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          top: insets.top + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable style={styles.banner} onPress={onPress}>
        <View style={styles.textBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {displayTitle}
          </Text>
          <Text numberOfLines={2} style={styles.body}>
            {displayBody}
          </Text>
        </View>
        <Pressable hitSlop={8} style={styles.closeButton} onPress={onClose}>
          <MaterialDesignIcons
            name="close"
            size={16}
            color={AppColorStyles.gray1}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    backgroundColor: AppColorStyles.surface,
    paddingVertical: 16,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: AppColorStyles.black,
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      lineHeight: 21,
      color: AppColorStyles.black,
    }),
  },
  body: {
    marginTop: 2,
    ...PretendardTextStyle.medium({
      fontSize: 15,
      lineHeight: 20,
      color: AppColorStyles.gray1,
    }),
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
