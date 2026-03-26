import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
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

import { useHomeViewModel } from '../viewmodels/useHomeViewModel';
import { HomeHeaderSection } from './components/HomeHeaderSection';
import { hs } from './components/homeScale';
import { MonthlyTrendSection } from './components/MonthlyTrendSection';
import { PendingSettlementSection } from './components/PendingSettlementSection';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<AppTabParamList, 'Home'>>();
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

  if (dashboardData == null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColorStyles.yellow} />
      </View>
    );
  }

  const fallbackSections =
    state.status === 'loaded' ? state.fallbackSections : [];

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
        <HomeHeaderSection profile={dashboardData.profile} />

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

        <PendingSettlementSection
          items={dashboardData.pendingSettlements}
          onPressTransfer={(item) => handleOpenRoomSettlement(item.roomId)}
        />

        <View style={styles.divider} />

        <MonthlyTrendSection trends={dashboardData.monthlyTrends} />
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
