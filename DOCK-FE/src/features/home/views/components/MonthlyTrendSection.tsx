import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { MonthlyTrendPoint } from '../../models/homeTypes';
import { hs } from './homeScale';
import { MonthlyTrendChart } from './MonthlyTrendChart';

interface MonthlyTrendSectionProps {
  trends: MonthlyTrendPoint[];
}

export function MonthlyTrendSection({ trends }: MonthlyTrendSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>월별 지출 추이</Text>
      <View style={styles.card}>
        <MonthlyTrendChart trends={trends} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: hs(24),
    gap: hs(12),
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(16),
      lineHeight: hs(16),
      color: AppColorStyles.black,
    }),
  },
  card: {
    borderRadius: hs(10),
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: hs(14),
    paddingVertical: hs(12),
    shadowColor: '#676767',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

