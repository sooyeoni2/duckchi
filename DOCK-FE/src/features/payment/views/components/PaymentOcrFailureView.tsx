import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type {
  OcrFailureType,
  OcrReceiptSummary,
} from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentOcrFailureViewProps {
  failureType: OcrFailureType;
  summary?: OcrReceiptSummary;
  onRetry: () => void;
  onFallback: () => void;
}

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '시간 정보 없음';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
};

export function PaymentOcrFailureView({
  failureType,
  summary,
  onRetry,
  onFallback,
}: PaymentOcrFailureViewProps) {
  const isReceiptUnreadable = failureType === 'RECEIPT_UNREADABLE';

  return (
    <View>
      {summary != null && !isReceiptUnreadable && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>총 금액</Text>
          <Text style={styles.summaryAmount}>{formatAmount(summary.totalAmount)}</Text>
          <Text style={styles.summaryMeta}>
            {`${summary.storeName} · ${formatDate(summary.paidAt)}`}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.messageCard,
          !isReceiptUnreadable && styles.warningMessageCard,
        ]}
      >
        <Text style={styles.messageTitle}>
          {isReceiptUnreadable
            ? '영수증을 읽지 못했어요'
            : '세부 항목을 읽지 못했어요'}
        </Text>

        <Text style={styles.messageDescription}>
          {isReceiptUnreadable
            ? '영수증이 흐리거나 빛 반사가 심해요'
            : '총금액만 등록하고 항목은 나중에 직접 추가할 수 있어요'}
        </Text>

        <Text style={styles.messageDescription}>
          {isReceiptUnreadable
            ? '다시 찍거나 직접 입력해 주세요'
            : '필요하면 다시 촬영해서 인식을 시도해 주세요'}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onRetry}
          wrapperStyle={styles.primaryButtonWrap}
          style={[styles.actionButton, styles.primaryButton]}
        >
          <Text style={styles.primaryButtonText}>다시 촬영하기</Text>
        </PaymentAnimatedTouchable>

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onFallback}
          wrapperStyle={styles.secondaryButtonWrap}
          style={[styles.actionButton, styles.secondaryButton]}
        >
          <Text style={styles.secondaryButtonText}>
            {isReceiptUnreadable ? '직접 입력하기' : '총 금액만 등록'}
          </Text>
        </PaymentAnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  summaryLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textHint,
    }),
  },
  summaryAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
    marginTop: 10,
  },
  summaryMeta: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.textHint,
    }),
    marginTop: 10,
  },
  messageCard: {
    minHeight: 210,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  warningMessageCard: {
    backgroundColor: AppColorStyles.yellowLight,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    minHeight: 170,
  },
  messageTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24,
      color: AppColorStyles.black,
    }),
    textAlign: 'center',
  },
  messageDescription: {
    ...PretendardTextStyle.medium({
      fontSize: 18,
      lineHeight: 28,
      color: AppColorStyles.textHint,
    }),
    textAlign: 'center',
    marginTop: 14,
  },
  actionRow: {
    flexDirection: 'row',
  },
  primaryButtonWrap: {
    flex: 1,
    marginRight: 12,
  },
  secondaryButtonWrap: {
    flex: 1,
  },
  actionButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: AppColorStyles.yellow,
  },
  secondaryButton: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 1.5,
    borderColor: AppColorStyles.yellow,
  },
  primaryButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  secondaryButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
});
