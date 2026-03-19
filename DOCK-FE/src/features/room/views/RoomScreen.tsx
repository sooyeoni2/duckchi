import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList, RootStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';

import { meetingRoomMockData } from '../models/roomMockData';
import { useSettlementViewModel } from '../viewmodels/useSettlementViewModel';
import { SettlementCard } from './components/SettlementCard';
import { SettlementTabHeader } from './components/SettlementTabHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const ROOM_TABS = ['결제', '정산', '순위'] as const;
const SELECTED_TAB_INDEX = 1;
const CTA_HEIGHT = 60;

type RoomViewMode = 'SUMMARY' | 'TRANSFER';

interface SettlementRow {
  id: number;
  title: string;
  subtitle: string;
  amount: number;
}

const participatedPayments: SettlementRow[] = [
  { id: 1, title: '고기집', subtitle: '류병선 올림 · 6명', amount: 120000 },
  { id: 2, title: '엔젤리너스', subtitle: '류병선 올림 · 6명', amount: 60000 },
];

const settlementRequests: SettlementRow[] = [
  { id: 3, title: '볼링', subtitle: '류병선 올림 · 6명', amount: 30000 },
];

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;
type Nav = NativeStackNavigationProp<RoomStackParamList, 'RoomDetail'>;
type Route = RouteProp<RoomStackParamList, 'RoomDetail'>;

export function RoomScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [viewMode, setViewMode] = useState<RoomViewMode>('SUMMARY');
  const room = meetingRoomMockData.find((item) => item.roomId === route.params.roomId) ?? meetingRoomMockData[0];
  const expectedAmount = room != null ? Math.round(room.totalPay / Math.max(room.memberCount, 1)) : 0;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (viewMode === 'TRANSFER') {
    return <RoomSettlementTransferView onBack={() => setViewMode('SUMMARY')} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        titleWidget={<Text style={styles.summaryRoomTitle}>{room?.roomName ?? '모임 상세'}</Text>}
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={handleBack}
        actions={[
          <TouchableOpacity
            key="more"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.moreButton}
            activeOpacity={0.8}
          >
            <MaterialDesignIcons name="dots-horizontal" size={24 * s} color={AppColorStyles.black} />
          </TouchableOpacity>,
        ]}
      />

      <View style={styles.roomTabContainer}>
        {ROOM_TABS.map((tab, index) => (
          <View key={tab} style={styles.roomTabButton}>
            <Text style={index === SELECTED_TAB_INDEX ? styles.roomTabActive : styles.roomTabInactive}>{tab}</Text>
          </View>
        ))}

        <View style={styles.roomTabTrack} />
        <View style={styles.roomTabIndicator} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.expectedCard} activeOpacity={0.85} onPress={() => setViewMode('TRANSFER')}>
          <Text style={styles.expectedLabel}>내 예상 금액</Text>
          <Text style={styles.expectedAmount}>{toWon(expectedAmount)}</Text>
          <View style={styles.expectedBottomRow}>
            <Text style={styles.expectedHint}>금액이 변동될 수 있어요</Text>
            <Text style={styles.expectedAction}>탭하여 정산하기 →</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.sectionCardLarge}>
          <Text style={styles.sectionTitle}>내가 참여한 결제</Text>
          {participatedPayments.map((item, index) => (
            <SettlementRowCard key={item.id} item={item} isLast={index === participatedPayments.length - 1} />
          ))}
        </View>

        <View style={styles.sectionCardSmall}>
          <Text style={styles.sectionTitle}>정산 요청 목록</Text>
          {settlementRequests.map((item, index) => (
            <SettlementRowCard key={item.id} item={item} isLast={index === settlementRequests.length - 1} />
          ))}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>모임 전체 합계</Text>
          <Text style={styles.totalAmount}>{toWon(room?.totalPay ?? 0)}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoomSettlementTransferView({ onBack }: { onBack: () => void }) {
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
        contentContainerStyle={styles.transferScrollContent}
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
          <View style={styles.transferFooterInScroll}>
            <FilledButton text="전체 송금하기" onPress={hasPending ? goToPayPasswordInput : undefined} height={CTA_HEIGHT * s} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettlementRowCard({ item, isLast }: { item: SettlementRow; isLast: boolean }) {
  return (
    <View style={[styles.rowCard, isLast && styles.rowCardLast]}>
      <View>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.rowAmount}>{toWon(item.amount)}</Text>
    </View>
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

  summaryRoomTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 20 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.black,
    }),
  },
  moreButton: {
    width: 36 * s,
    height: 36 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomTabContainer: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: AppColorStyles.background,
  },
  roomTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * s,
  },
  roomTabActive: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 25 * s,
      color: AppColorStyles.black,
      letterSpacing: -0.32 * s,
    }),
  },
  roomTabInactive: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 25 * s,
      color: AppColorStyles.gray2,
      letterSpacing: -0.32 * s,
    }),
  },
  roomTabTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5 * s,
    backgroundColor: '#CECECE',
  },
  roomTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 134 * s,
    width: 144 * s,
    height: 5 * s,
    backgroundColor: AppColorStyles.black,
    borderRadius: 4 * s,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21 * s,
    paddingTop: 25 * s,
    paddingBottom: 20 * s,
  },

  expectedCard: {
    height: 128 * s,
    backgroundColor: AppColorStyles.gray1,
    borderRadius: 10 * s,
    paddingHorizontal: 14 * s,
    paddingTop: 14 * s,
    paddingBottom: 10 * s,
    marginBottom: 16 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  expectedLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.gray3,
    }),
  },
  expectedAmount: {
    marginTop: 8 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.white,
    }),
  },
  expectedBottomRow: {
    marginTop: 18 * s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expectedHint: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 12 * s,
      color: AppColorStyles.gray3,
    }),
  },
  expectedAction: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 12 * s,
      color: AppColorStyles.white,
    }),
  },

  sectionCardLarge: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10 * s,
    paddingHorizontal: 12 * s,
    paddingTop: 14 * s,
    paddingBottom: 12 * s,
    marginBottom: 12 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionCardSmall: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10 * s,
    paddingHorizontal: 12 * s,
    paddingTop: 14 * s,
    paddingBottom: 12 * s,
    marginBottom: 8 * s,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 10 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.black,
    }),
  },
  rowCard: {
    height: 87 * s,
    borderRadius: 10 * s,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 14 * s,
    marginBottom: 16 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  rowCardLast: {
    marginBottom: 0,
  },
  rowTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18 * s,
      lineHeight: 24 * s,
      color: AppColorStyles.black,
    }),
  },
  rowSubtitle: {
    marginTop: 6 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 11 * s,
      lineHeight: 11 * s,
      color: AppColorStyles.gray3,
    }),
  },
  rowAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.gray1,
    }),
  },

  totalCard: {
    height: 73 * s,
    backgroundColor: AppColorStyles.gray1,
    borderRadius: 10 * s,
    paddingHorizontal: 14 * s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  totalLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.gray3,
    }),
  },
  totalAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.white,
    }),
  },

  transferScrollContent: {
    paddingHorizontal: 21 * s,
    paddingTop: 24 * s,
    paddingBottom: 24 * s,
  },
  transferFooterInScroll: {
    marginTop: 30 * s,
    paddingHorizontal: 0,
    paddingBottom: 12 * s,
  },
  emptyBox: {
    marginTop: 28 * s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 18 * s, color: AppColorStyles.gray2 }),
  },
});
