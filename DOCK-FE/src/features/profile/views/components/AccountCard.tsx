import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { getBankColor } from '../../../../core/constants/bankColors';
import { profileCardStyle } from '../profileCardStyle';
import type { Account } from '../../models/profileTypes';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const bankColor = getBankColor(account.bankCode);

  return (
    <View style={[profileCardStyle.card, styles.card]}>
      <Text style={profileCardStyle.cardLabel}>대표 계좌</Text>
      <View style={styles.row}>
        <View style={[styles.bankIconCircle, { backgroundColor: bankColor.bg }]}>
          <Text style={[styles.bankIconText, { color: bankColor.text }]}>
            {account.bankName.charAt(0)}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.bankName}>{account.bankName}</Text>
          <Text style={styles.accountNumber}>{account.accountNumber}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 20,
    paddingBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIconText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 17, color: AppColorStyles.black }),
  },
  info: {
    gap: 8,
  },
  bankName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 22, color: AppColorStyles.black }),
  },
  accountNumber: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.textDisabled }),
  },
});
