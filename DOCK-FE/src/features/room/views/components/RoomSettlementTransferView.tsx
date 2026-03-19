import React from 'react';
import { useNavigation } from '@react-navigation/native';
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
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';

import { useSettlementViewModel } from '../../viewmodels/useSettlementViewModel';
import { SettlementCard } from './SettlementCard';
import { SettlementTabHeader } from './SettlementTabHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;
const CTA_HEIGHT = 60;

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
    reload,
  } = useSettlementViewModel();

  const hasPending = inProgressCount > 0;

  const goToPayPasswordInput = () => {
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
          <SettlementCard key={item.id} item={item} onPressTransfer={goToPayPasswordInput} />
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
              onPress={hasPending ? goToPayPasswordInput : undefined}
              height={CTA_HEIGHT * s}
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
    paddingTop: 24 * s,
    paddingBottom: 24 * s,
  },
  emptyBox: {
    marginTop: 28 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 18 * s, color: AppColorStyles.gray2 }),
  },
  footer: {
    marginTop: 30 * s,
    paddingBottom: 12 * s,
  },
});
