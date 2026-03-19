import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { SettlementViewItem } from '../../models/settlementTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

interface SettlementCardProps {
  item: SettlementViewItem;
  onPressTransfer: () => void;
}

const toneColor = {
  SAFE: AppColorStyles.success,
  CAUTION: AppColorStyles.caution,
  OVERDUE: AppColorStyles.warning,
  DONE: AppColorStyles.gray2,
} as const;

export function SettlementCard({ item, onPressTransfer }: SettlementCardProps) {
  const isCompleted = item.status === 'COMPLETED';
  const disabled = isCompleted;

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.timeLabel}>{item.timeLabel}</Text>
      <Text style={[styles.timeText, { color: toneColor[item.tone] }]}>{item.timeText}</Text>

      <View style={styles.innerCard}>
        <View style={styles.metaSection}>
          <Text style={[styles.storeName, isCompleted && styles.completedMainText]}>{item.storeName}</Text>
          <Text style={[styles.requesterName, isCompleted && styles.completedSubText]}>{item.requesterName} 요청</Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={[styles.amountText, isCompleted && styles.completedMainText]}>
            {item.amount.toLocaleString('ko-KR')}원
          </Text>
          <TouchableOpacity
            disabled={disabled}
            onPress={onPressTransfer}
            activeOpacity={0.85}
            style={[styles.transferButton, disabled && styles.transferButtonDisabled]}
          >
            <Text style={[styles.transferText, disabled && styles.transferTextDisabled]}>
              {isCompleted ? '정산완료' : '송금하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isCompleted && (
        <Text style={[styles.guideText, { color: toneColor[item.tone] }]}>{item.guideMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10 * s,
    paddingTop: 14 * s,
    paddingBottom: 13 * s,
    marginBottom: 21 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  timeLabel: {
    marginLeft: 18 * s,
    ...KBODiaGothicTextStyle.medium({ fontSize: 14 * s, color: AppColorStyles.gray3, lineHeight: 14 * s }),
  },
  timeText: {
    marginTop: 12 * s,
    marginBottom: 10 * s,
    marginLeft: 18 * s,
    ...KBODiaGothicTextStyle.bold({ fontSize: 24 * s, lineHeight: 24 * s }),
  },
  innerCard: {
    marginHorizontal: 18 * s,
    height: 95 * s,
    backgroundColor: AppColorStyles.white,
    borderRadius: 10 * s,
    paddingHorizontal: 12 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  metaSection: {
    flex: 1,
    marginRight: 10 * s,
  },
  storeName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20 * s, color: AppColorStyles.black, lineHeight: 24 * s }),
  },
  requesterName: {
    marginTop: 10 * s,
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: AppColorStyles.gray3, lineHeight: 15 * s }),
  },
  amountSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8 * s,
  },
  amountText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 22 * s, color: AppColorStyles.gray1, lineHeight: 22 * s }),
  },
  completedMainText: {
    color: AppColorStyles.gray2,
  },
  completedSubText: {
    color: AppColorStyles.gray3,
  },
  transferButton: {
    width: 60 * s,
    height: 24 * s,
    backgroundColor: '#EFEFEF',
    borderRadius: 6 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferButtonDisabled: {
    backgroundColor: AppColorStyles.gray4,
  },
  transferText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.black, lineHeight: 16 * s }),
  },
  transferTextDisabled: {
    color: AppColorStyles.gray2,
  },
  guideText: {
    marginTop: 20 * s,
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({ fontSize: 14 * s, lineHeight: 20 * s }),
  },
});