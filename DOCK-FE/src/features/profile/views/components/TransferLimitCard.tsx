import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { formatAmount } from '../../../../core/utils/formatters';
import { profileCardStyle } from '../profileCardStyle';

interface TransferLimitCardProps {
  transferLimit: number;
}

export function TransferLimitCard({ transferLimit }: TransferLimitCardProps) {
  return (
    <View style={[profileCardStyle.card, styles.card]}>
      <Text style={styles.label}>자동이체 한도</Text>
      <Text style={styles.amount}>{formatAmount(transferLimit)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  label: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.textHint }),
  },
  amount: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 18, color: AppColorStyles.black }),
  },
});
