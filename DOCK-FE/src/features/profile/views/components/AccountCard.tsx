import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { getBankColor } from '../../../../core/constants/bankColors';
import { profileCardStyle } from '../profileCardStyle';
import type { Account } from '../../models/profileTypes';

interface AccountCardProps {
  account: Account;
  onDelete: (accountId: number) => void;
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const bankColor = getBankColor(account.bankCode);

  const handleDelete = () => {
    Alert.alert('계좌 삭제', '대표 계좌를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => onDelete(account.accountId) },
    ]);
  };

  return (
    <View style={[profileCardStyle.card, styles.card]}>
      <View style={styles.labelRow}>
        <Text style={[profileCardStyle.cardLabel, { marginBottom: 0 }]}>대표 계좌</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    width: 60,
    height: 24,
    borderWidth: 1,
    borderColor: AppColorStyles.danger,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 10, color: AppColorStyles.danger }),
    letterSpacing: 0.5,
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
