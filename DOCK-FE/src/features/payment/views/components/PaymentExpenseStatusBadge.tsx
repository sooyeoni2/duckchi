import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { PretendardTextStyle } from '@core/theme/typography';
import {
  getExpenseStatusMeta,
  type PaymentExpenseStatusTone,
} from '../../models/paymentDisplay';
import type { MyExpenseItem } from '../../models/paymentTypes';

interface PaymentExpenseStatusBadgeProps {
  status: MyExpenseItem['status'];
}

function getToneStyles(tone: PaymentExpenseStatusTone) {
  switch (tone) {
    case 'pending':
      return {
        backgroundColor: AppColorStyles.yellowLight,
        borderColor: AppColorStyles.yellow,
        color: AppColorStyles.black,
      };
    case 'requested':
      return {
        backgroundColor: AppColorStyles.gray1,
        borderColor: AppColorStyles.gray1,
        color: AppColorStyles.white,
      };
    case 'settled':
    default:
      return {
        backgroundColor: AppColorStyles.gray4,
        borderColor: AppColorStyles.gray4,
        color: AppColorStyles.gray1,
      };
  }
}

export function PaymentExpenseStatusBadge({
  status,
}: PaymentExpenseStatusBadgeProps) {
  const meta = getExpenseStatusMeta(status);
  const toneStyles = getToneStyles(meta.tone);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: toneStyles.backgroundColor,
          borderColor: toneStyles.borderColor,
        },
      ]}
    >
      <Text
        style={PretendardTextStyle.semiBold({
          fontSize: 11,
          color: toneStyles.color,
        })}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    marginLeft: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
