import React, { useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';

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

export function RoomSettlementTransferScreen({ onBack, roomId }: RoomSettlementTransferScreenProps) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    state,
    selectedTab,
    setSelectedTab,
    isTransferring,
    inProgressCount,
    settlementItems,
    transferSingle,
    transferAllPending,
    checkAutoDebitAgreed,
    reload,
    refresh,
  } = useSettlementViewModel(roomId);

  const [refreshing, setRefreshing] = React.useState(false);
  const [isCheckingConsent, setIsCheckingConsent] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const hasPending = inProgressCount > 0;
  const consume = usePaymentConfirmStore((s) => s.consume);
  const setPending = usePaymentConfirmStore((s) => s.setPending);

  const executeTransferAction = useCallback(async (action: PaymentAction) => {
    try {
      if (action.type === 'all') {
        await transferAllPending();
        return;
      }
      await transferSingle(action.id);
    } catch (error) {
      Alert.alert(
        '송금 실패',
        error instanceof Error ? error.message : '송금 처리 중 오류가 발생했습니다.',
      );
    }
  }, [transferAllPending, transferSingle]);

  useFocusEffect(
    useCallback(() => {
      const result = consume();
      if (result?.confirmed) {
        void executeTransferAction(result.action);
      }
    }, [consume, executeTransferAction]),
  );

  const handleTransferAction = useCallback((action: PaymentAction) => {
    if (isTransferring || isCheckingConsent) {
      return;
    }

    void (async () => {
      setIsCheckingConsent(true);
      try {
        const isAgreed = await checkAutoDebitAgreed();

        // 버튼 클릭 시점에 서버 GET으로 동의 여부를 확정하고 분기한다.
        if (isAgreed) {
          await executeTransferAction(action);
          return;
        }

        setPending(action);
        rootNavigation.navigate('PayPasswordInput');
      } finally {
        setIsCheckingConsent(false);
      }
    })();
  }, [
    checkAutoDebitAgreed,
    executeTransferAction,
    isCheckingConsent,
    isTransferring,
    rootNavigation,
    setPending,
  ]);

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColorStyles.yellow} />
      </View>
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
        {settlementItems.map(item => (
          <SettlementCard
            key={item.id}
            item={item}
            onPressTransfer={() => handleTransferAction({ type: 'single', id: item.id })}
          />
        ))}

        {settlementItems.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>표시할 정산 내역이 없습니다.</Text>
          </View>
        )}

        {selectedTab === 'IN_PROGRESS' && (
          <View style={styles.footer}>
            <FilledButton
              text="전체 송금하기"
              onPress={hasPending && !isTransferring && !isCheckingConsent ? () => handleTransferAction({ type: 'all' }) : undefined}
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
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, color: AppColorStyles.gray1 }),
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
});
