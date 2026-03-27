import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

import type { MonthlyTrendPoint } from '../../models/homeTypes';
import { hs } from './homeScale';

interface MonthlyTrendChartProps {
  trends: MonthlyTrendPoint[];
}

const toManwon = (amount: number): number => Math.round(amount / 10000);
const formatMonth = (month: string): string => `${month.slice(5, 7)}월`;
const CHART_HEIGHT = 124;
const MIN_AXIS_MAX = 30;
const AXIS_STEP = 10;

export function MonthlyTrendChart({ trends }: MonthlyTrendChartProps) {
  const filledTrends = trends.filter((item) => item.totalAmount > 0);

  if (filledTrends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>표시할 지출 데이터가 없습니다.</Text>
      </View>
    );
  }

  const displayItems = filledTrends.slice(-3);
  const maxValue = Math.max(...displayItems.map((item) => item.totalAmount), 1);
  const maxManwon = Math.max(toManwon(maxValue), AXIS_STEP);
  const axisMax = Math.max(MIN_AXIS_MAX, Math.ceil(maxManwon / AXIS_STEP) * AXIS_STEP);
  const yTicks: number[] = [];
  for (let value = AXIS_STEP; value <= axisMax; value += AXIS_STEP) {
    yTicks.push(value);
  }

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.yLabel}>만원</Text>
      <View style={styles.plotRow}>
        <View style={styles.yAxisLabelColumn}>
          {[...yTicks].reverse().map((tick) => (
            <Text key={tick} style={styles.yAxisLabel}>
              {tick}
            </Text>
          ))}
        </View>

        <View style={styles.plotArea}>
          <View style={styles.barsContainer}>
            {displayItems.map((item, index) => {
              const isLast = index === displayItems.length - 1;
              const barHeight = (toManwon(item.totalAmount) / axisMax) * hs(CHART_HEIGHT - 4);
              return (
                <View key={`${item.month}-${index}`} style={styles.barItem}>
                  <View
                    style={[
                      styles.barFill,
                      isLast ? styles.barFillActive : styles.barFillDefault,
                      { height: Math.max(barHeight, hs(8)) },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.baseline} />
          <View style={styles.monthRow}>
            {displayItems.map((item, index) => (
              <Text key={`${item.month}-${index}`} style={styles.monthText}>
                {formatMonth(item.month)}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    height: hs(190),
    borderRadius: hs(10),
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...PretendardTextStyle.medium({
      fontSize: hs(12),
      lineHeight: hs(16),
      color: AppColorStyles.gray2,
    }),
  },
  chartContainer: {
    minHeight: hs(208),
    paddingTop: hs(4),
  },
  yLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(10),
      lineHeight: hs(10),
      color: AppColorStyles.black,
    }),
  },
  plotRow: {
    marginTop: hs(8),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  yAxisLabelColumn: {
    height: hs(CHART_HEIGHT),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: hs(8),
    width: hs(24),
  },
  yAxisLabel: {
    ...KBODiaGothicTextStyle.light({
      fontSize: hs(10),
      lineHeight: hs(10),
      color: AppColorStyles.black,
    }),
  },
  plotArea: {
    flex: 1,
  },
  barsContainer: {
    height: hs(CHART_HEIGHT),
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderLeftWidth: 1,
    borderLeftColor: AppColorStyles.gray2,
    paddingHorizontal: hs(6),
    paddingBottom: hs(2),
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: hs(52),
    borderRadius: hs(12),
  },
  barFillDefault: {
    backgroundColor: AppColorStyles.gray4,
  },
  barFillActive: {
    backgroundColor: AppColorStyles.yellow,
  },
  baseline: {
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.gray2,
  },
  monthRow: {
    marginTop: hs(8),
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: hs(6),
  },
  monthText: {
    flex: 1,
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(10),
      lineHeight: hs(10),
      color: AppColorStyles.black,
    }),
  },
});
