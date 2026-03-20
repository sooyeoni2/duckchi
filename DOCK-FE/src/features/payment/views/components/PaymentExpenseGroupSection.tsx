import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { MyExpenseItem } from '../../models/paymentTypes';
import { PaymentExpenseSelectionCard } from './PaymentExpenseSelectionCard';

interface PaymentExpenseGroupSectionProps {
  title: string;
  caption?: string;
  expenses: MyExpenseItem[];
  emptyMessage: string;
  selectedExpenseIds: number[];
  onToggleExpense: (expenseId: number) => void;
  onOpenDetail: (expenseId: number) => void;
}

export function PaymentExpenseGroupSection({
  title,
  caption,
  expenses,
  emptyMessage,
  selectedExpenseIds,
  onToggleExpense,
  onOpenDetail,
}: PaymentExpenseGroupSectionProps) {
  return (
    <View style={styles.groupSection}>
      <View style={styles.groupHeader}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
        >
          {title}
        </Text>

        {caption != null && (
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 12,
              color: AppColorStyles.textSecondary,
            })}
          >
            {caption}
          </Text>
        )}
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyGroupBox}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 13,
              color: AppColorStyles.textSecondary,
            })}
          >
            {emptyMessage}
          </Text>
        </View>
      ) : (
        expenses.map((expense) => (
          <PaymentExpenseSelectionCard
            key={expense.expenseId}
            expense={expense}
            selected={selectedExpenseIds.includes(expense.expenseId)}
            onToggle={() => onToggleExpense(expense.expenseId)}
            onDetailPress={() => onOpenDetail(expense.expenseId)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupSection: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyGroupBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.gray5,
    marginBottom: 12,
  },
});
