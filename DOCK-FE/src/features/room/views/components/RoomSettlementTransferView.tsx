import React, { useCallback, useRef } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Dimensions,
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
import { SettlementCard } from './SettlementCard';
import { SettlementTabHeader } from './SettlementTabHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;
const CTA_HEIGHT = 60 * s;

interface RoomSettlementTransferViewProps {
  onBack: () => void;
}

export function RoomSettlementTransferView({ onBack }: RoomSettlementTransferViewProps) {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    state,
    selectedTab,
    setSelectedTab,
    inProgressCount,
    settlementItems,
    markAsPaid,
    markAllAsPaid,
    reload,
  } = useSettlementViewModel();

  const hasPending = inProgressCount > 0;
  const consume = usePaymentConfirmStore((s) => s.consume);
  const pendingActionRef = useRef<PaymentAction | null>(null);

  useFocusEffect(
    useCallback(() => {
      const result = consume();
      if (result?.confirmed && pendingActionRef.current) {
        if (pendingActionRef.current.type === 'all') {
          markAllAsPaid();
        } else {
          markAsPaid(pendingActionRef.current.id);
        }
      }
      pendingActionRef.current = null;
    }, [consume, markAsPaid, markAllAsPaid]),
  );

  const setPending = usePaymentConfirmStore((s) => s.setPending);

  const goToPayPasswordInput = (action: PaymentAction) => {
    pendingActionRef.current = action;
    setPending(action);
    rootNavigation.navigate('PayPasswordInput');
  };

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
        <FilledButton text="다시 시도" onPress={reload} isFullWidth={false} width={160} height={52} />
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
      >
        {settlementItems.map(item => (
          <SettlementCard
            key={item.id}
            item={item}
            onPressTransfer={() => goToPayPasswordInput({ type: 'single', id: item.id })}
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
              onPress={hasPending ? () => goToPayPasswordInput({ type: 'all' }) : undefined}
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
