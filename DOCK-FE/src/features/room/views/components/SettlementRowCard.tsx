import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { RoomSettlementRow } from '../../models/roomDetailMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

interface SettlementRowCardProps {
  item: RoomSettlementRow;
  isLast: boolean;
  onPress?: () => void;
}

export function SettlementRowCard({
  item,
  isLast,
  onPress,
}: SettlementRowCardProps) {
  const content = (
    <>
      <View style={styles.textArea}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>

      <View style={styles.trailingArea}>
        <Text style={styles.rowAmount}>{toWon(item.amount)}</Text>
        {onPress != null && (
          <MaterialDesignIcons
            name="chevron-right"
            size={22 * s}
            color={AppColorStyles.textHint}
          />
        )}
      </View>
    </>
  );

  if (onPress == null) {
    return <View style={[styles.rowCard, isLast && styles.rowCardLast]}>{content}</View>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.rowCard, isLast && styles.rowCardLast]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    minHeight: 87 * s,
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
  textArea: {
    flex: 1,
    paddingRight: 12 * s,
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
  trailingArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowAmount: {
    marginRight: 2 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.gray1,
    }),
  },
});
