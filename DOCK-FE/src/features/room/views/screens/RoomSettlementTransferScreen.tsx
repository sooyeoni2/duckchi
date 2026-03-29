import React, { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Animated,
  Dimensions,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList, RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { ShimmerBlock } from '@shared/components/feedback/ShimmerBlock';

import { usePaymentConfirmStore, type PaymentAction } from '../../models/paymentConfirmStore';
import { useSettlementViewModel } from '../../viewmodels/useSettlementViewModel';
import { SettlementCard } from '../components/SettlementCard';
import { SettlementTabHeader } from '../components/SettlementTabHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;
const CTA_HEIGHT = 60 * s;

interface RoomSettlementTransferScreenProps {
  onBack: () => void;
  roomId: number;
}

export function RoomSettlementTransferScreen({
  onBack,
  roomId,
}: RoomSettlementTransferScreenProps) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const roomNavigation = useNavigation<NativeStackNavigationProp<RoomStackParamList>>();
  const {
    state,
    selectedTab,
    setSelectedTab,
    isTransferring,
    inProgressCount,
    settlementItems,
    checkAutoDebitAgreed,
    reload,
    refresh,
  } = useSettlementViewModel(roomId);

  const [refreshing, setRefreshing] = React.useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = React.useState(false);
  const itemEntryAnimsRef = React.useRef<Animated.Value[]>([]);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const hasPending = inProgressCount > 0;
  const emptyMessage =
    selectedTab === 'COMPLETED'
      ? '완료된 정산 내역이 없습니다.'
      : '진행중인 정산 내역이 없습니다.';
  const consume = usePaymentConfirmStore((store) => store.consume);
  const setPending = usePaymentConfirmStore((store) => store.setPending);
  const settlementAnimKey = React.useMemo(
    () => settlementItems.map((item) => `${item.id}:${item.status}`).join('|'),
    [settlementItems],
  );

  const openTransferActionScreen = useCallback(
    (action: PaymentAction) => {
      const settlementIds =
        action.type === 'single'
          ? [action.id]
          : state.status === 'loaded'
            ? state.items
                .filter((item) => item.status === 'IN_PROGRESS')
                .map((item) => item.id)
            : [];

      if (settlementIds.length === 0) {
        return;
      }

      roomNavigation.navigate('SettlementTransferAction', {
        roomId,
        settlementIds,
      });
    },
    [roomId, roomNavigation, state],
  );

  useFocusEffect(
    useCallback(() => {
      const result = consume();
      if (result?.confirmed) {
        openTransferActionScreen(result.action);
      }
    }, [consume, openTransferActionScreen]),
  );

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => undefined);
    }, [refresh]),
  );

  const handleTransferAction = useCallback(
    (action: PaymentAction) => {
      if (isTransferring || isCheckingConsent) {
        return;
      }

      const run = async () => {
        setIsCheckingConsent(true);
        try {
          const isAgreed = await checkAutoDebitAgreed();

          // 버튼 클릭 시점에 서버 GET으로 동의 여부를 확정하고 분기한다.
          if (isAgreed) {
            openTransferActionScreen(action);
            return;
          }

          setPending(action);
          rootNavigation.navigate('PayPasswordInput');
        } finally {
          setIsCheckingConsent(false);
        }
      };

      run().catch(() => undefined);
    },
    [
      checkAutoDebitAgreed,
      openTransferActionScreen,
      isCheckingConsent,
      isTransferring,
      rootNavigation,
      setPending,
    ],
  );

  React.useEffect(() => {
    if (state.status !== 'loaded') {
      return;
    }

    itemEntryAnimsRef.current = settlementItems.map(
      (_, index) => itemEntryAnimsRef.current[index] ?? new Animated.Value(0),
    );
    itemEntryAnimsRef.current.forEach((anim) => anim.setValue(0));

    Animated.stagger(
      50,
      itemEntryAnimsRef.current.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 230,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })),
    ).start();
  }, [selectedTab, settlementAnimKey, settlementItems, state.status]);

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <CustomAppBar
          title="정산하기"
          centerTitle={false}
          showDivider
          backgroundColor={AppColorStyles.background}
          onBackPress={onBack}
        />
        <SettlementTabHeader
          selectedTab="IN_PROGRESS"
          inProgressCount={0}
          onChangeTab={() => undefined}
        />
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={`settlement-skeleton-${index}`} style={styles.loadingCard}>
              <ShimmerBlock width="28%" height={14 * s} borderRadius={6 * s} />
              <ShimmerBlock
                width="42%"
                height={24 * s}
                borderRadius={10 * s}
                style={{ marginTop: 10 * s }}
              />
              <View style={styles.loadingInnerCard}>
                <View>
                  <ShimmerBlock width={120 * s} height={18 * s} borderRadius={8 * s} />
                  <ShimmerBlock
                    width={84 * s}
                    height={13 * s}
                    borderRadius={6 * s}
                    style={{ marginTop: 8 * s }}
                  />
                </View>
                <View style={styles.loadingInnerRightColumn}>
                  <ShimmerBlock width={86 * s} height={20 * s} borderRadius={8 * s} />
                  <ShimmerBlock
                    width={72 * s}
                    height={28 * s}
                    borderRadius={10 * s}
                    style={{ marginTop: 8 * s }}
                  />
                </View>
              </View>
            </View>
          ))}
          <View style={styles.loadingFooter}>
            <ShimmerBlock width="100%" height={CTA_HEIGHT} borderRadius={14 * s} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorMessage}>{state.message}</Text>
        <FilledButton
          text="다시 시도"
          onPress={reload}
          isFullWidth={false}
          width={160 * s}
          height={52 * s}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        title="정산하기"
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={onBack}
      />

      <SettlementTabHeader
        selectedTab={selectedTab}
        inProgressCount={inProgressCount}
        onChangeTab={setSelectedTab}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={AppColorStyles.black}
          />
        }
      >
        {settlementItems.map((item, index) => {
          const anim = itemEntryAnimsRef.current[index] ?? new Animated.Value(1);
          return (
            <Animated.View
              key={item.id}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14 * s, 0],
                    }),
                  },
                ],
              }}
            >
              <SettlementCard
                item={item}
                onPressTransfer={() =>
                  handleTransferAction({ type: 'single', id: item.id })}
              />
            </Animated.View>
          );
        })}

        {settlementItems.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        )}

        {selectedTab === 'IN_PROGRESS' && (
          <View style={styles.footer}>
            <FilledButton
              text="전체 송금하기"
              onPress={
                hasPending && !isTransferring && !isCheckingConsent
                  ? () => handleTransferAction({ type: 'all' })
                  : undefined
              }
              isLoading={isTransferring || isCheckingConsent}
              height={CTA_HEIGHT}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.background,
    paddingHorizontal: 24 * s,
    gap: 12 * s,
  },
  errorMessage: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      color: AppColorStyles.gray1,
    }),
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21 * s,
    paddingTop: 20 * s,
    paddingBottom: 32 * s,
  },
  emptyBox: {
    paddingVertical: 20 * s,
    paddingHorizontal: 16 * s,
    borderRadius: 14 * s,
    backgroundColor: AppColorStyles.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
  footer: {
    marginTop: 20 * s,
    paddingBottom: 12 * s,
  },
  loadingCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18 * s,
    paddingHorizontal: 16 * s,
    paddingTop: 16 * s,
    paddingBottom: 16 * s,
    marginBottom: 8 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  loadingInnerCard: {
    marginTop: 10 * s,
    height: 95 * s,
    borderRadius: 14 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 14 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingInnerRightColumn: {
    alignItems: 'flex-end',
  },
  loadingFooter: {
    marginTop: 20 * s,
    paddingBottom: 12 * s,
  },
});
