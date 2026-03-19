import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '../../../core/theme/typography';

/**
 * 덕치 앱의 보조 액션에 사용되는 Outline 버튼
 *
 * 사용 예시:
 * ```tsx
 * <OutlineButton text="다시 뽑기" onPress={() => handleRedraw()} />
 * ```
 */

interface OutlineButtonProps {
  text: string;
  onPress?: () => void;
  isLoading?: boolean;
  isFullWidth?: boolean;
  width?: number;
  height?: number;
  borderRadius?: number;
  borderColor?: string;
  textColor?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: StyleProp<TextStyle>;
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
  text,
  onPress,
  isLoading = false,
  isFullWidth = true,
  width,
  height = 60,
  borderRadius = 10,
  borderColor,
  textColor,
  prefixIcon,
  suffixIcon,
  style,
  textStyle,
}) => {
  const disabled = isLoading || !onPress;
  const effectiveBorderColor = disabled
    ? AppColorStyles.gray4
    : (borderColor ?? AppColorStyles.yellow);
  const effectiveTextColor = disabled
    ? AppColorStyles.textDisabled
    : (textColor ?? AppColorStyles.textPrimary);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          width: isFullWidth ? '100%' : width,
          height,
          borderRadius,
          borderColor: effectiveBorderColor,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={effectiveTextColor} />
      ) : (
        <View style={styles.content}>
          {prefixIcon != null && <View style={styles.iconPrefix}>{prefixIcon}</View>}
          <Text
            style={[
              KBODiaGothicTextStyle.bold({ fontSize: 20, color: effectiveTextColor }),
              textStyle,
            ]}
          >
            {text}
          </Text>
          {suffixIcon != null && <View style={styles.iconSuffix}>{suffixIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

/** 작은 크기의 Outline 버튼 */
export const OutlineButtonSmall: React.FC<
  Omit<OutlineButtonProps, 'isFullWidth' | 'height' | 'borderRadius'>
> = (props) => <OutlineButton {...props} isFullWidth={false} height={40} borderRadius={8} />;

/**
 * 텍스트만 있는 버튼 (예: 다시 촬영, 취소 등 보조 액션)
 */
interface TextOnlyButtonProps {
  text: string;
  onPress?: () => void;
  textColor?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
}

export const TextOnlyButton: React.FC<TextOnlyButtonProps> = ({
  text,
  onPress,
  textColor,
  prefixIcon,
  suffixIcon,
}) => {
  const effectiveTextColor = textColor ?? AppColorStyles.textSecondary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.textButton}>
      {prefixIcon != null && <View style={styles.iconPrefix}>{prefixIcon}</View>}
      <Text style={PretendardTextStyle.semiBold({ fontSize: 14, color: effectiveTextColor })}>
        {text}
      </Text>
      {suffixIcon != null && <View style={styles.iconSuffix}>{suffixIcon}</View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: AppColorStyles.white,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconPrefix: {
    marginRight: 6,
  },
  iconSuffix: {
    marginLeft: 6,
  },
});
