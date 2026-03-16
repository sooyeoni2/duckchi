import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { getBankColor } from '../../../../core/constants/bankColors';
import { ConfirmDialog } from '../../../../shared/components';
import { profileCardStyle } from '../profileCardStyle';
import type { Account } from '../../models/profileTypes';

interface AccountCardProps {
  account: Account;
  onDelete: (accountId: number) => void;
}

export function AccountCard({ account, onDelete }: AccountCardProps) {
  const bankColor = getBankColor(account.bankCode);
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <View style={[profileCardStyle.card, styles.card]}>
      <ConfirmDialog
        visible={confirmVisible}
        title="계좌 삭제"
        message="대표 계좌를 삭제하시겠습니까?"
        cancelText="취소"
        confirmText="삭제"
        confirmColor={AppColorStyles.danger}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          onDelete(account.accountId);
        }}
      />
      <View style={styles.labelRow}>
        <Text style={[profileCardStyle.cardLabel, { marginBottom: 0 }]}>대표 계좌</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => setConfirmVisible(true)}>
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
    paddingTop: 14,
    paddingBottom: 28,
    paddingHorizontal: 16,
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
