import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppTabParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { PretendardTextStyle } from '@core/theme/typography';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { ShimmerBlock } from '@shared/components/feedback/ShimmerBlock';

import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { HomeHeaderSection } from './components/HomeHeaderSection';
import { hs } from './components/homeScale';
import { MonthlyTrendSection } from './components/MonthlyTrendSection';
import { PendingSettlementSection } from './components/PendingSettlementSection';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList, 'Home'>>();
  const headerFade = React.useRef(new Animated.Value(0)).current;
  const pendingFade = React.useRef(new Animated.Value(0)).current;
  const trendFade = React.useRef(new Animated.Value(0)).current;
  const {
    state,
    isRefreshing,
    refresh,
    reload,
  } = useHomeViewModel();

  const handleOpenRoomSettlement = useCallback(
    (roomId: number) => {
      navigation.navigate('Room', {
        screen: 'RoomDetail',
        params: { roomId },
      });
    },
    [navigation],
  );

  const dashboardData =
    state.status === 'loaded'
      ? state.data
      : state.status === 'error'
        ? state.data
        : null;

  React.useEffect(() => {
    if (dashboardData == null) {
      return;
    }

    headerFade.setValue(0);
    pendingFade.setValue(0);
    trendFade.setValue(0);

    Animated.stagger(90, [
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(pendingFade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.timing(trendFade, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
    ]).start();
  }, [dashboardData, headerFade, pendingFade, trendFade]);

  if (dashboardData == null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.skeletonHeaderCard}>
            <ShimmerBlock width="36%" height={hs(16)} borderRadius={hs(8)} />
            <ShimmerBlock width="58%" height={hs(28)} borderRadius={hs(10)} style={{ marginTop: hs(10) }} />
            <ShimmerBlock width="28%" height={hs(14)} borderRadius={hs(7)} style={{ marginTop: hs(16) }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.skeletonSectionCard}>
            <ShimmerBlock width="42%" height={hs(16)} borderRadius={hs(8)} />
            <ShimmerBlock width="100%" height={hs(84)} borderRadius={hs(14)} style={{ marginTop: hs(12) }} />
            <ShimmerBlock width="100%" height={hs(84)} borderRadius={hs(14)} style={{ marginTop: hs(8) }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.skeletonSectionCard}>
            <ShimmerBlock width="34%" height={hs(16)} borderRadius={hs(8)} />
            <ShimmerBlock width="100%" height={hs(124)} borderRadius={hs(14)} style={{ marginTop: hs(12) }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const fallbackSections =
    state.status === 'loaded' ? state.fallbackSections : [];
  const getFadeUpStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue,
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={AppColorStyles.black}
          />
        }
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={getFadeUpStyle(headerFade)}>
          <HomeHeaderSection profile={dashboardData.profile} />
        </Animated.View>

        <View style={styles.divider} />

        {state.status === 'error' && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{state.message}</Text>
            <FilledButton
              text="다시 시도"
              onPress={reload}
              isFullWidth={false}
              width={hs(128)}
              height={hs(44)}
            />
          </View>
        )}

        {fallbackSections.length > 0 && (
          <Text style={styles.fallbackText}>
            일부 데이터 로드에 실패해 임시 데이터를 표시합니다.
          </Text>
        )}

        <Animated.View style={getFadeUpStyle(pendingFade)}>
          <PendingSettlementSection
            items={dashboardData.pendingSettlements}
            onPressTransfer={(item) => handleOpenRoomSettlement(item.roomId)}
          />
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View style={getFadeUpStyle(trendFade)}>
          <MonthlyTrendSection trends={dashboardData.monthlyTrends} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  contentContainer: {
    paddingHorizontal: hs(22),
    paddingTop: hs(14),
    paddingBottom: hs(36),
  },
  centered: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonHeaderCard: {
    marginTop: hs(4),
    backgroundColor: AppColorStyles.surface,
    borderRadius: hs(16),
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: hs(14),
    paddingVertical: hs(14),
  },
  skeletonSectionCard: {
    marginTop: hs(16),
    backgroundColor: AppColorStyles.surface,
    borderRadius: hs(16),
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: hs(14),
    paddingTop: hs(14),
    paddingBottom: hs(14),
  },
  divider: {
    marginTop: hs(24),
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.gray3,
  },
  errorBanner: {
    marginTop: hs(18),
    borderRadius: hs(12),
    borderWidth: 1,
    borderColor: AppColorStyles.gray3,
    backgroundColor: AppColorStyles.white,
    padding: hs(12),
    gap: hs(10),
  },
  errorText: {
    ...PretendardTextStyle.medium({
      fontSize: hs(13),
      lineHeight: hs(18),
      color: AppColorStyles.gray1,
    }),
  },
  fallbackText: {
    marginTop: hs(14),
    ...PretendardTextStyle.medium({
      fontSize: hs(11),
      lineHeight: hs(16),
      color: AppColorStyles.gray2,
    }),
  },
});
