import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { PendingSettlementCardItem } from '../../models/homeTypes';
import { hs } from './homeScale';

interface PendingSettlementCardProps {
  item: PendingSettlementCardItem;
  onPressTransfer: () => void;
}

const formatAmount = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

const getRemainingText = (remainingHours: number): string =>
  remainingHours <= 0 ? '기한 초과' : `${remainingHours}시간 남음`;

export function PendingSettlementCard({
  item,
  onPressTransfer,
}: PendingSettlementCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.headerText}>
        {item.roomName} · {item.requesterName}님 요청
      </Text>

      <View style={styles.amountRow}>
        <Text style={styles.amountText}>{formatAmount(item.amount)}</Text>
        <TouchableOpacity
          style={styles.transferButton}
          onPress={onPressTransfer}
          activeOpacity={0.8}
        >
          <Text style={styles.transferButtonText}>지금 송금</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.progressRatio * 100}%` }]} />
        </View>
        <Text style={styles.timeText}>{getRemainingText(item.remainingHours)}</Text>
      </View>

      <Text style={styles.titleText}>{item.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: hs(10),
    backgroundColor: AppColorStyles.white,
    paddingVertical: hs(14),
    paddingHorizontal: hs(14),
    shadowColor: '#676767',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(15),
      lineHeight: hs(15),
      color: AppColorStyles.gray2,
    }),
  },
  amountRow: {
    marginTop: hs(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: hs(24),
      lineHeight: hs(24),
      color: AppColorStyles.gray1,
    }),
  },
  transferButton: {
    minWidth: hs(90),
    height: hs(39),
    borderRadius: hs(6),
    borderWidth: 2,
    borderColor: '#EFEFEF',
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hs(12),
  },
  transferButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(13),
      lineHeight: hs(16),
      color: AppColorStyles.black,
    }),
  },
  progressRow: {
    marginTop: hs(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    width: hs(160),
    height: hs(8),
    borderRadius: hs(4),
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    marginRight: hs(10),
  },
  progressFill: {
    height: '100%',
    borderRadius: hs(4),
    backgroundColor: AppColorStyles.black,
  },
  timeText: {
    ...KBODiaGothicTextStyle.light({
      fontSize: hs(10),
      lineHeight: hs(10),
      color: AppColorStyles.gray2,
    }),
  },
  titleText: {
    marginTop: hs(8),
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(11),
      lineHeight: hs(11),
      color: AppColorStyles.gray3,
    }),
  },
});
