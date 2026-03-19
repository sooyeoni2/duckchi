import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { MyExpenseItem } from '../../models/paymentTypes';

interface PaymentExpenseSelectionCardProps {
  expense: MyExpenseItem;
  selected: boolean;
  onToggle: () => void;
  onDetailPress: () => void;
}

const STATUS_LABEL: Record<MyExpenseItem['status'], string> = {
  PENDING: '정산 전',
  REQUESTED: '요청됨',
  SETTLED: '완료',
};

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '일시 미정';
  }

  return `${date.getMonth() + 1}.${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;
};

/**
 * 와이어프레임의 결제 선택 카드를 payment 전용 컴포넌트로 분리했다.
 * 선택 상태는 부모가 관리하고, 이 카드는 표현과 클릭 이벤트 전달만 담당한다.
 */
export function PaymentExpenseSelectionCard({
  expense,
  selected,
  onToggle,
  onDetailPress,
}: PaymentExpenseSelectionCardProps) {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onToggle}
        style={styles.topRow}
      >
        <View style={styles.titleRow}>
          <MaterialDesignIcons
            name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={22}
            color={selected ? AppColorStyles.gray1 : AppColorStyles.black}
            style={styles.checkboxIcon}
          />

          <View style={styles.titleWrap}>
            <Text
              style={KBODiaGothicTextStyle.bold({
                fontSize: 18,
                color: AppColorStyles.black,
              })}
            >
              {expense.title}
            </Text>
            <Text
              style={PretendardTextStyle.medium({
                fontSize: 12,
                color: AppColorStyles.textSecondary,
              })}
            >
              {`${STATUS_LABEL[expense.status]} · ${formatDate(expense.paidAt)}`}
            </Text>
          </View>
        </View>

        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.gray1,
          })}
        >
          {formatAmount(expense.totalAmount)}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 12,
            color: AppColorStyles.textSecondary,
          })}
        >
          {expense.inputType === 'ACCOUNT_HISTORY'
            ? '계좌 내역'
            : expense.inputType === 'OCR'
              ? '영수증 OCR'
              : '직접 입력'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDetailPress}
          style={styles.detailChip}
        >
          <Text
            style={PretendardTextStyle.semiBold({
              fontSize: 12,
              color: AppColorStyles.black,
            })}
          >
            상세내역
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 14,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  checkboxIcon: {
    marginRight: 10,
  },
  titleWrap: {
    flex: 1,
  },
  bottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: AppColorStyles.gray4,
  },
});
