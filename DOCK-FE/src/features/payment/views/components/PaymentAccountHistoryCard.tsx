import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { AccountHistoryItem } from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentAccountHistoryCardProps {
  history: AccountHistoryItem;
  onAddToCart: () => void;
}

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const formatDateTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
};

/**
 * 계좌 거래 내역 한 건을 보여주는 카드.
 * 현재 단계에서는 거래 메모/금액/거래시간만 먼저 노출하고, 버튼 클릭 시 등록 폼으로 보낸다.
 */
export function PaymentAccountHistoryCard({
  history,
  onAddToCart,
}: PaymentAccountHistoryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          {history.transactionMemo}
        </Text>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.gray1,
          })}
        >
          {formatAmount(history.amount)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 13,
            color: AppColorStyles.textHint,
          })}
        >
          {history.transactionAt ? formatDateTime(new Date(history.transactionAt)) : ''}
        </Text>

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onAddToCart}
          style={styles.primaryButton}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            장바구니 담기
          </Text>
        </PaymentAnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    borderRadius: 16,
    backgroundColor: AppColorStyles.surface,
    marginBottom: 18,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bottomRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    minWidth: 148,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
  },
});
