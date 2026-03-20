import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { SettlementTab } from '../../models/settlementTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

interface SettlementTabHeaderProps {
  selectedTab: SettlementTab;
  inProgressCount: number;
  onChangeTab: (tab: SettlementTab) => void;
}

export function SettlementTabHeader({
  selectedTab,
  inProgressCount,
  onChangeTab,
}: SettlementTabHeaderProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.8}
        onPress={() => onChangeTab('IN_PROGRESS')}
      >
        <Text style={selectedTab === 'IN_PROGRESS' ? styles.activeLabel : styles.inactiveLabel}>
          진행중 ({inProgressCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        activeOpacity={0.8}
        onPress={() => onChangeTab('COMPLETED')}
      >
        <Text style={selectedTab === 'COMPLETED' ? styles.activeLabel : styles.inactiveLabel}>
          완료
        </Text>
      </TouchableOpacity>

      <View style={styles.lineTrack} />

      <View
        style={[
          styles.indicator,
          selectedTab === 'IN_PROGRESS' ? styles.leftIndicator : styles.rightIndicator,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: AppColorStyles.background,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10 * s,
  },
  activeLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, lineHeight: 25 * s, color: '#151414', letterSpacing: -0.32 * s }),
  },
  inactiveLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, lineHeight: 25 * s, color: AppColorStyles.gray2, letterSpacing: -0.32 * s }),
  },
  lineTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5 * s,
    backgroundColor: '#CECECE',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '50%',
    height: 5 * s,
    backgroundColor: AppColorStyles.black,
  },
  leftIndicator: {
    left: 0,
  },
  rightIndicator: {
    left: '50%',
  },
});