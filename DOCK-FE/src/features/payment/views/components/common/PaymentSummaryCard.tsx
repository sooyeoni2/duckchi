import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';

interface PaymentSummaryCardProps {
  totalAmount: number;
  expenseCount: number;
  pendingCount: number;
  requestedCount: number;
  settledCount: number;
}

interface SummaryMetricProps {
  label: string;
  value: string;
}

/**
 * 합계 금액은 화면 여러 곳에서 같은 형태로 보일 수 있으므로 helper로 분리한다.
 */
const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

/**
 * 요약 카드 안의 작은 지표 한 칸.
 * 중복되는 마크업을 줄이기 위해 내부 컴포넌트로 분리했다.
 */
function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <View style={styles.metricCard}>
      <Text
        style={PretendardTextStyle.medium({
          fontSize: 12,
          color: AppColorStyles.textSecondary,
        })}
      >
        {label}
      </Text>
      <Text
        style={KBODiaGothicTextStyle.medium({
          fontSize: 15,
          color: AppColorStyles.black,
        })}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * 목록 전체를 한눈에 보여주는 상단 요약 카드.
 * 서버 summary가 없어도 ViewModel에서 계산한 파생값만 받아 그린다.
 */
export function PaymentSummaryCard({
  totalAmount,
  expenseCount,
  pendingCount,
  requestedCount,
  settledCount,
}: PaymentSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 13,
              color: AppColorStyles.textSecondary,
            })}
          >
            내 결제 합계
          </Text>
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 30,
              color: AppColorStyles.black,
            })}
          >
            {formatAmount(totalAmount)}
          </Text>
        </View>

        <View style={styles.highlightChip}>
          <Text
            style={PretendardTextStyle.semiBold({
              fontSize: 12,
              color: AppColorStyles.black,
            })}
          >
            {expenseCount}건
          </Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <SummaryMetric label="정산 전" value={`${pendingCount}건`} />
        <SummaryMetric label="요청됨" value={`${requestedCount}건`} />
        <SummaryMetric label="완료" value={`${settledCount}건`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  highlightChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColorStyles.yellow,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: AppColorStyles.gray5,
    marginRight: 8,
  },
});
