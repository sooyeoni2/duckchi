import React from 'react';
import { SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';
import { AppColorStyles } from '../../../core/theme/colors';
import { MainNavigationBar, NavigationItem } from './MainNavigationBar';

/**
 * 덕치 앱 메인 Scaffold — 하단 네비게이션 포함
 *
 * 사용 예시:
 * ```tsx
 * <MainScaffold
 *   currentIndex={currentIndex}
 *   onNavigationPress={(index) => setCurrentIndex(index)}
 *   navigationItems={NAV_ITEMS}
 * >
 *   {pages[currentIndex]}
 * </MainScaffold>
 * ```
 */

interface MainScaffoldProps {
  currentIndex: number;
  onNavigationPress: (index: number) => void;
  navigationItems: NavigationItem[];
  children: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const MainScaffold: React.FC<MainScaffoldProps> = ({
  currentIndex,
  onNavigationPress,
  navigationItems,
  children,
  backgroundColor,
  style,
}) => {
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: backgroundColor ?? AppColorStyles.background }, style]}
    >
      <View style={styles.body}>{children}</View>
      <MainNavigationBar
        currentIndex={currentIndex}
        onPress={onNavigationPress}
        items={navigationItems}
      />
    </SafeAreaView>
  );
};

/**
 * 페이지 상태를 유지하는 MainScaffold (IndexedStack 방식)
 *
 * 사용 예시:
 * ```tsx
 * <MainScaffoldWithPages
 *   currentIndex={currentIndex}
 *   onNavigationPress={(index) => setCurrentIndex(index)}
 *   navigationItems={NAV_ITEMS}
 *   pages={[
 *     <GatheringListScreen />,
 *     <SettleStatusScreen />,
 *     <MyPaymentScreen />,
 *     <ProfileScreen />,
 *   ]}
 * />
 * ```
 */

interface MainScaffoldWithPagesProps {
  currentIndex: number;
  onNavigationPress: (index: number) => void;
  navigationItems: NavigationItem[];
  pages: React.ReactNode[];
  backgroundColor?: string;
  style?: ViewStyle;
}

export const MainScaffoldWithPages: React.FC<MainScaffoldWithPagesProps> = ({
  currentIndex,
  onNavigationPress,
  navigationItems,
  pages,
  backgroundColor,
  style,
}) => {
  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: backgroundColor ?? AppColorStyles.background }, style]}
    >
      <View style={styles.body}>
        {pages.map((page, index) => (
          <View
            key={index}
            style={[styles.page, { display: currentIndex === index ? 'flex' : 'none' }]}
          >
            {page}
          </View>
        ))}
      </View>
      <MainNavigationBar
        currentIndex={currentIndex}
        onPress={onNavigationPress}
        items={navigationItems}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
