import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

import { PaymentExpenseDetailView } from '../../../payment/views/components/PaymentExpenseDetailView';
import type { MyExpenseDetail } from '../../../payment/models/paymentTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

export type SettlementDetailState =
  | { status: 'idle' }
  | { status: 'loading'; expenseId: number }
  | { status: 'loaded'; expenseId: number; detail: MyExpenseDetail }
  | { status: 'error'; expenseId: number; message: string };

interface RoomSettlementDetailScreenProps {
  settlementDetailState: SettlementDetailState;
  onRetry: (expenseId: number) => void;
}

export function RoomSettlementDetailScreen({
  settlementDetailState,
  onRetry,
}: RoomSettlementDetailScreenProps) {
  if (settlementDetailState.status === 'loading') {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.sceneCenterCard}>
          <Text style={styles.messageText}>상세 내역을 불러오는 중입니다.</Text>
        </View>
      </View>
    );
  }

  if (settlementDetailState.status === 'error') {
    return (
      <View style={styles.detailContainer}>
        <View style={styles.sceneCenterCard}>
          <Text style={styles.errorText}>{settlementDetailState.message}</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onRetry(settlementDetailState.expenseId)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (settlementDetailState.status !== 'loaded') {
    return null;
  }

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <PaymentExpenseDetailView
        expense={settlementDetailState.detail}
        onEdit={() => {}}
        onCancel={() => {}}
        editDisabled
        cancelDisabled
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21 * s,
    paddingTop: 20 * s,
    paddingBottom: 32 * s,
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 21 * s,
    paddingTop: 20 * s,
  },
  sceneCenterCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 21 * s,
    paddingVertical: 28 * s,
    borderRadius: 18 * s,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  messageText: {
    ...PretendardTextStyle.medium({
      fontSize: 14 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.textSecondary,
    }),
    textAlign: 'center',
  },
  errorText: {
    ...PretendardTextStyle.medium({
      fontSize: 14 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.textSecondary,
    }),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16 * s,
    paddingHorizontal: 16 * s,
    paddingVertical: 10 * s,
    borderRadius: 10 * s,
    backgroundColor: AppColorStyles.yellow,
  },
  retryButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 14 * s,
      color: AppColorStyles.black,
    }),
  },
});
