import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

import type { MonthlyTrendPoint } from '../../models/homeTypes';
import { hs } from './homeScale';

interface MonthlyTrendChartProps {
  trends: MonthlyTrendPoint[];
}

const toManwon = (amount: number): number => Math.round(amount / 10000);
const formatMonth = (month: string): string => {
  // "2026-03" -> "26/03"
  const parts = month.split('-');
  if (parts.length < 2) return month;
  return `${parts[0].slice(2, 4)}/${parts[1]}`;
};
const CHART_HEIGHT = 124;
const MIN_AXIS_MAX = 30;
const AXIS_STEP = 10;

export function MonthlyTrendChart({ trends }: MonthlyTrendChartProps) {
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
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
  const maxManwon = toManwon(maxValue);
  
  // 최소 5만원(5만용) 기준, 최대값의 1.2배 정도로 여유를 두고 축 설정 (단, 너무 작으면 5 고정)
  const axisMax = Math.max(5, Math.ceil(maxManwon * 1.15));
  
  // 3단계의 보조선 라벨 계산 (Max, 2/3, 1/3)
  const yTicks: number[] = [
    axisMax,
    Math.round((axisMax * 2) / 3),
    Math.round(axisMax / 3),
  ];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.yLabel}>만원</Text>
      <View style={styles.plotRow}>
        <View style={styles.yAxisLabelColumn}>
          {yTicks.map((tick) => (
            <Text key={tick} style={styles.yAxisLabel}>
              {tick}
            </Text>
          ))}
        </View>

        <View style={styles.plotArea}>
          <View style={styles.barsContainer}>
            {displayItems.map((item, index) => {
              const isLast = index === displayItems.length - 1;
              const isSelected = selectedIdx === index;
              // axisMax는 만원 단위이므로 10000을 곱해 원 단위로 변환 후 비율 계산
              const barHeight = (item.totalAmount / (axisMax * 10000)) * hs(CHART_HEIGHT - 4);
              const actualBarHeight = Math.max(barHeight, hs(8));
              
              return (
                <View key={`${item.month}-${index}`} style={styles.barItem}>
                  {isSelected && (
                    <View style={[styles.tooltipContainer, { bottom: actualBarHeight + hs(4) }]}>
                      <View style={styles.tooltipBox}>
                        <Text style={styles.tooltipText}>
                          {item.totalAmount.toLocaleString()}원
                        </Text>
                      </View>
                      <View style={styles.tooltipArrow} />
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedIdx(isSelected ? null : index)}
                    style={styles.barTouchArea}
                  >
                    <View
                      style={[
                        styles.barFill,
                        isLast ? styles.barFillActive : styles.barFillDefault,
                        { height: actualBarHeight },
                      ]}
                    />
                  </TouchableOpacity>
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
  barTouchArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tooltipContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: hs(8),
    paddingVertical: hs(4),
    borderRadius: hs(6),
  },
  tooltipText: {
    ...PretendardTextStyle.medium({
      fontSize: hs(11),
      color: AppColorStyles.white,
    }),
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: hs(5),
    borderLeftColor: 'transparent',
    borderRightWidth: hs(5),
    borderRightColor: 'transparent',
    borderTopWidth: hs(5),
    borderTopColor: 'rgba(0, 0, 0, 0.8)',
    marginTop: -1,
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
