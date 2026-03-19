import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { RoomSettlementRow } from '../../models/roomDetailMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

interface SettlementRowCardProps {
  item: RoomSettlementRow;
  isLast: boolean;
}

export function SettlementRowCard({ item, isLast }: SettlementRowCardProps) {
  return (
    <View style={[styles.rowCard, isLast && styles.rowCardLast]}>
      <View>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.rowAmount}>{toWon(item.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    height: 87 * s,
    borderRadius: 10 * s,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 14 * s,
    marginBottom: 16 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  rowCardLast: {
    marginBottom: 0,
  },
  rowTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.black,
    }),
  },
  rowSubtitle: {
    marginTop: 6 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 11 * s,
      lineHeight: 11 * s,
      color: AppColorStyles.gray3,
    }),
  },
  rowAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.gray1,
    }),
  },
});
