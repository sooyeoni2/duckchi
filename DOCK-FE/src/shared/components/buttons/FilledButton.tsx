import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { AppColorStyles } from '../../../core/theme/colors';
import { PretendardTextStyle } from '../../../core/theme/typography';

/**
 * 덕치 앱의 주요 액션에 사용되는 Filled 버튼
 *
 * ⚠️ 배경 #FEEC7E(yellow), 텍스트 반드시 검정(#000000) 사용
 *
 * 사용 예시:
 * ```tsx
 * <FilledButton text="장바구니 담기" onPress={() => handleAddToCart()} />
 * ```
 */

interface FilledButtonProps {
  text: string;
  onPress?: () => void;
  isLoading?: boolean;
  isFullWidth?: boolean;
  width?: number;
  height?: number;
  borderRadius?: number;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const FilledButton: React.FC<FilledButtonProps> = ({
  text,
  onPress,
  isLoading = false,
  isFullWidth = true,
  width,
  height = 52,
  borderRadius = 12,
  prefixIcon,
  suffixIcon,
  style,
}) => {
  const disabled = isLoading || !onPress;

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
          backgroundColor: disabled ? AppColorStyles.gray4 : AppColorStyles.yellow,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={AppColorStyles.black} />
      ) : (
        <View style={styles.content}>
          {prefixIcon != null && <View style={styles.iconPrefix}>{prefixIcon}</View>}
          <Text
            style={[
              PretendardTextStyle.semiBold({ fontSize: 16 }),
              { color: disabled ? AppColorStyles.textHint : AppColorStyles.black },
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

/** 작은 크기의 Filled 버튼 (예: 인원 설정, 수정 버튼) */
export const FilledButtonSmall: React.FC<
  Omit<FilledButtonProps, 'isFullWidth' | 'height' | 'borderRadius'>
> = (props) => <FilledButton {...props} isFullWidth={false} height={40} borderRadius={8} />;

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrefix: {
    marginRight: 8,
  },
  iconSuffix: {
    marginLeft: 8,
  },
});
