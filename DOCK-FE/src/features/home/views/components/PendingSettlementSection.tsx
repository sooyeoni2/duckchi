import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { PendingSettlementCardItem } from '../../models/homeTypes';
import { hs } from './homeScale';
import { PendingSettlementCard } from './PendingSettlementCard';

interface PendingSettlementSectionProps {
  items: PendingSettlementCardItem[];
  onPressTransfer: (item: PendingSettlementCardItem) => void;
}

export function PendingSettlementSection({
  items,
  onPressTransfer,
}: PendingSettlementSectionProps) {
  const hasPending = items.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>정산 대기 중</Text>

      {hasPending ? (
        <View style={styles.cardList}>
          {items.map((item) => (
            <PendingSettlementCard
              key={item.settlementId}
              item={item}
              onPressTransfer={() => onPressTransfer(item)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>대기중인 정산 목록이 없습니다</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: hs(22),
    gap: hs(14),
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(16),
      lineHeight: hs(16),
      color: AppColorStyles.black,
    }),
  },
  cardList: {
    gap: hs(12),
  },
  emptyCard: {
    width: '100%',
    minHeight: hs(120),
    borderRadius: hs(10),
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: hs(20),
  },
  emptyText: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(14),
      lineHeight: hs(20),
      color: AppColorStyles.gray1,
    }),
  },
});
