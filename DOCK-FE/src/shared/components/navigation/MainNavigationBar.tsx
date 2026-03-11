import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { AppColorStyles } from '../../../core/theme/colors';

/**
 * 덕치 앱 메인 하단 네비게이션 바
 *
 * 탭 구성: 모임 목록 / 정산 현황 / 내 결제 / 프로필
 *
 * 사용 예시:
 * ```tsx
 * <MainNavigationBar
 *   currentIndex={currentIndex}
 *   onPress={(index) => setCurrentIndex(index)}
 *   items={NAV_ITEMS}
 * />
 * ```
 */

export interface NavigationItem {
  /** 비활성 아이콘 */
  icon: React.ReactNode;
  /** 활성 아이콘 (없으면 icon 재사용) */
  activeIcon?: React.ReactNode;
}

/** 덕치 기본 네비게이션 아이템 (홈 / 카드 / 통계 / 프로필) */
export const DUCKCHI_NAV_ITEMS: NavigationItem[] = [
  {
    icon: <MaterialDesignIcons name="home-outline" size={26} color={AppColorStyles.gray2} />,
    activeIcon: <MaterialDesignIcons name="home" size={26} color={AppColorStyles.black} />,
  },
  {
    icon: <MaterialDesignIcons name="credit-card-outline" size={26} color={AppColorStyles.gray2} />,
    activeIcon: <MaterialDesignIcons name="credit-card" size={26} color={AppColorStyles.black} />,
  },
  {
    icon: <MaterialDesignIcons name="chart-bar" size={26} color={AppColorStyles.gray2} />,
    activeIcon: <MaterialDesignIcons name="chart-bar" size={26} color={AppColorStyles.black} />,
  },
  {
    icon: <MaterialDesignIcons name="account-outline" size={26} color={AppColorStyles.gray2} />,
    activeIcon: <MaterialDesignIcons name="account" size={26} color={AppColorStyles.black} />,
  },
];

interface MainNavigationBarProps {
  currentIndex: number;
  onPress: (index: number) => void;
  items: NavigationItem[];
  backgroundColor?: string;
  style?: ViewStyle;
}

export const MainNavigationBar: React.FC<MainNavigationBarProps> = ({
  currentIndex,
  onPress,
  items,
  backgroundColor,
  style,
}) => {
  return (
    <View
      style={[styles.container, { backgroundColor: backgroundColor ?? AppColorStyles.gray5 }, style]}
    >
      {items.map((item, index) => {
        const isSelected = currentIndex === index;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onPress(index)}
            activeOpacity={0.7}
            style={styles.item}
          >
            {isSelected ? (item.activeIcon ?? item.icon) : item.icon}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#CECECE',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
