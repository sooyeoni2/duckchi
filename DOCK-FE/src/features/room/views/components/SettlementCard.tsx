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
  SAFE: '#43E062',
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
    borderRadius: 18,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  timeLabel: {
    marginLeft: 16,
    ...KBODiaGothicTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.textHint, lineHeight: 13 * s }),
  },
  timeText: {
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 16,
    ...KBODiaGothicTextStyle.bold({ fontSize: 24 * s, lineHeight: 24 * s }),
  },
  innerCard: {
    marginHorizontal: 16,
    height: 95 * s,
    backgroundColor: AppColorStyles.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  metaSection: {
    flex: 1,
    marginRight: 10,
  },
  storeName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20 * s, color: AppColorStyles.black, lineHeight: 24 * s }),
  },
  requesterName: {
    marginTop: 8,
    ...KBODiaGothicTextStyle.medium({ fontSize: 14 * s, color: AppColorStyles.gray3, lineHeight: 14 * s }),
  },
  amountSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  amountText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 22 * s, color: AppColorStyles.black, lineHeight: 22 * s }),
  },
  completedMainText: {
    color: AppColorStyles.textHint,
  },
  completedSubText: {
    color: AppColorStyles.textHint,
  },
  transferButton: {
    paddingHorizontal: 12,
    height: 28,
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferButtonDisabled: {
    backgroundColor: AppColorStyles.divider,
  },
  transferText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13 * s, color: AppColorStyles.black, lineHeight: 16 * s }),
  },
  transferTextDisabled: {
    color: AppColorStyles.textHint,
  },
  guideText: {
    marginTop: 14,
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({ fontSize: 13 * s, lineHeight: 20 * s }),
  },
});