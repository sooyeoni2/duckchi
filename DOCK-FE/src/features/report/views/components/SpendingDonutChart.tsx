import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SpendingDonutChartProps {
  size: number;
  strokeWidth: number;
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  totalAmount: number;
}

export function SpendingDonutChart({
  size,
  strokeWidth,
  categories,
  totalAmount,
}: SpendingDonutChartProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [categories, animatedValue]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // 세그먼트 간의 아주 작은 틈 (디자인적 요소)
  const GAP_DEGREE = categories.length > 1 ? 2 : 0;
  const totalGapLength = (GAP_DEGREE / 360) * circumference * categories.length;
  const availableCircumference = circumference - totalGapLength;

  let cumulativePercent = 0;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* 배경 가이드 링 (연한 회색) */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={AppColorStyles.divider}
            strokeWidth={strokeWidth - 2}
            fill="transparent"
            opacity={0.3}
          />
          
          {categories.map((cat, idx) => {
            const segmentLength = (cat.percentage / 100) * availableCircumference;
            const strokeDasharray = `${segmentLength} ${circumference}`;
            
            // 각 세그먼트의 시작점에 갭(여백)을 고려한 오프셋 계산
            const gapOffset = (idx * (GAP_DEGREE / 360)) * circumference;
            const strokeDashoffset = animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, -(circumference * cumulativePercent + gapOffset)],
            });

            cumulativePercent += (cat.percentage / 100);

            return (
              <AnimatedCircle
                key={`donut-seg-${idx}`}
                cx={center}
                cy={center}
                r={radius}
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            );
          })}
        </G>
      </Svg>
      
      {/* 중앙 라벨 */}
      <View style={styles.labelContainer}>
        <Text style={styles.totalLabel}>총 지출</Text>
        <Text style={styles.amountText} numberOfLines={1} adjustsFontSizeToFit>
          {totalAmount.toLocaleString()}원
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  totalLabel: {
    ...PretendardTextStyle.medium({
      fontSize: 12,
      color: AppColorStyles.textHint,
    }),
    marginBottom: 2,
  },
  amountText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
    textAlign: 'center',
  },
});
