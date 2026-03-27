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
import type { NotificationAction } from '../model/notificationTypes';

interface InAppNotificationBannerProps {
  visible: boolean;
  title?: string;
  body?: string;
  actions?: NotificationAction[];
  onPress: () => void;
  onClose: () => void;
  onActionPress?: (action: NotificationAction) => void;
}

export function InAppNotificationBanner({
  visible,
  title,
  body,
  actions = [],
  onPress,
  onClose,
  onActionPress,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [displayTitle, setDisplayTitle] = React.useState(title ?? '알림');
  const [displayBody, setDisplayBody] = React.useState(body ?? '새로운 알림이 도착했습니다.');

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    setDisplayTitle(title ?? '알림');
    setDisplayBody(body ?? '새로운 알림이 도착했습니다.');
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
      <View style={styles.banner}>
        <Pressable style={styles.contentPress} onPress={onPress}>
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

        {actions.length > 0 && (
          <View style={styles.actionRow}>
            {actions.slice(0, 2).map((action) => (
              <Pressable
                key={action.id}
                style={styles.actionButton}
                onPress={() => onActionPress?.(action)}
              >
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
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
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 14,
    shadowColor: AppColorStyles.black,
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  contentPress: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...PretendardTextStyle.semiBold({
      fontSize: 14,
      lineHeight: 18,
      color: AppColorStyles.black,
    }),
  },
});

