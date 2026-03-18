import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type {
  ExpenseInputType,
  ExpenseStatus,
  MyExpenseItem,
} from '../../models/paymentTypes';

interface ExpenseHistoryCardProps {
  expense: MyExpenseItem;
}

/**
 * 상태값을 바로 UI에 쓰지 않고, label/색상 묶음으로 변환해둔다.
 * 나중에 디자인이 바뀌어도 이 표만 수정하면 된다.
 */
const STATUS_META: Record<
  ExpenseStatus,
  { label: string; backgroundColor: string; textColor: string }
> = {
  PENDING: {
    label: '정산 전',
    backgroundColor: '#FFF3CF',
    textColor: '#8A5A00',
  },
  REQUESTED: {
    label: '요청됨',
    backgroundColor: '#EAF5FF',
    textColor: '#155D91',
  },
  SETTLED: {
    label: '완료',
    backgroundColor: '#EBF8EE',
    textColor: '#2D7A43',
  },
};

/**
 * 입력 방식도 동일하게 label + icon 조합으로 분리한다.
 */
const INPUT_META: Record<
  ExpenseInputType,
  { label: string; iconName: React.ComponentProps<typeof MaterialDesignIcons>['name'] }
> = {
  MANUAL: {
    label: '직접 입력',
    iconName: 'pencil-outline',
  },
  ACCOUNT_HISTORY: {
    label: '계좌 내역',
    iconName: 'bank-outline',
  },
  OCR: {
    label: 'OCR',
    iconName: 'file-document-outline',
  },
};

/** 금액 표시는 카드 전반에서 같은 형식으로 보이도록 통일한다. */
const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

/**
 * paidAt이 아직 없을 수도 있으므로 null 방어를 먼저 한다.
 */
const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '일시 미정';
  }

  return `${date.getMonth() + 1}.${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * 결제 목록 한 건을 보여주는 카드.
 * 목록 화면에서는 이 컴포넌트를 여러 번 렌더링해도 모양이 일정해야 하므로,
 * 모든 표시용 계산을 컴포넌트 내부 helper에 모아두었다.
 */
export function ExpenseHistoryCard({ expense }: ExpenseHistoryCardProps) {
  const statusMeta = STATUS_META[expense.status];
  const inputMeta = INPUT_META[expense.inputType];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 16,
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
            참여 {expense.participantCount}명
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusMeta.backgroundColor },
          ]}
        >
          <Text
            style={PretendardTextStyle.semiBold({
              fontSize: 11,
              color: statusMeta.textColor,
            })}
          >
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialDesignIcons
          name={inputMeta.iconName}
          size={16}
          color={AppColorStyles.textSecondary}
        />
        <Text
          style={PretendardTextStyle.regular({
            fontSize: 13,
            color: AppColorStyles.textSecondary,
          })}
        >
          {inputMeta.label}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 13,
            color: AppColorStyles.textSecondary,
          })}
        >
          {formatDate(expense.paidAt)}
        </Text>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          {formatAmount(expense.totalAmount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
