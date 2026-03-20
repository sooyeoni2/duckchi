import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentRequestActionButtonProps {
  label: string;
  onPress: () => void;
}

/**
 * 정산 요청 추가 영역의 3개 진입 버튼.
 * 공용 버튼을 수정하지 않고 와이어프레임 스타일을 맞추기 위해 payment 전용으로 분리했다.
 */
export function PaymentRequestActionButton({
  label,
  onPress,
}: PaymentRequestActionButtonProps) {
  return (
    <PaymentAnimatedTouchable
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.button}
    >
      <Text
        style={KBODiaGothicTextStyle.bold({
          fontSize: 18,
          lineHeight: 28,
          color: AppColorStyles.black,
        })}
      >
        {label}
      </Text>
    </PaymentAnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
