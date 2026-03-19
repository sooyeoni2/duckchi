import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import {
  PaymentTabContent,
  type PaymentTabContentHandle,
} from '../../payment/views/components/PaymentTabContent';
import { roomParticipatedPaymentsMock, roomSettlementRequestsMock } from '../models/roomDetailMockData';
import { meetingRoomMockData } from '../models/roomMockData';
import { useRoomStore } from '../models/roomStore';
import { RoomSettlementTransferView } from './components/RoomSettlementTransferView';
import { SettlementRowCard } from './components/SettlementRowCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const ROOM_TABS = [
  { key: 'PAYMENT', label: '결제' },
  { key: 'SETTLEMENT', label: '정산' },
  { key: 'RANKING', label: '순위' },
] as const;

type RoomViewMode = 'SUMMARY' | 'TRANSFER';
type RoomMainTab = (typeof ROOM_TABS)[number]['key'];

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;
type Nav = NativeStackNavigationProp<RoomStackParamList, 'RoomDetail'>;
type Route = RouteProp<RoomStackParamList, 'RoomDetail'>;

export function RoomScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const paymentTabRef = React.useRef<PaymentTabContentHandle | null>(null);
  const [viewMode, setViewMode] = useState<RoomViewMode>(
    route.params.showTransfer === true ? 'TRANSFER' : 'SUMMARY',
  );
  const [selectedRoomTab, setSelectedRoomTab] =
    useState<RoomMainTab>('SETTLEMENT');
  const [roomTabHistory, setRoomTabHistory] = useState<RoomMainTab[]>([]);
  const [settlementRefreshing, setSettlementRefreshing] = useState(false);

  const handleSettlementRefresh = React.useCallback(async () => {
    setSettlementRefreshing(true);
    // TODO: 실제 API 연동 시 여기서 데이터 재요청
    await new Promise<void>((resolve) => setTimeout(resolve, 500));
    setSettlementRefreshing(false);
  }, []);
  const rooms = useRoomStore((state) => state.rooms);
  const room =
    rooms.find((item) => item.roomId === route.params.roomId) ??
    meetingRoomMockData[0];
  const expectedAmount =
    room != null ? Math.round(room.totalPay / Math.max(room.memberCount, 1)) : 0;
  const participatedPayments = roomParticipatedPaymentsMock[room.roomId] ?? [];
  const settlementRequests = roomSettlementRequestsMock[room.roomId] ?? [];
  const selectedRoomTabIndex = ROOM_TABS.findIndex(
    (tab) => tab.key === selectedRoomTab,
  );

  const handleSelectRoomTab = React.useCallback((nextTab: RoomMainTab) => {
    setSelectedRoomTab((currentTab) => {
      if (currentTab === nextTab) {
        return currentTab;
      }

      setRoomTabHistory((previousHistory) => [...previousHistory, currentTab]);
      return nextTab;
    });
  }, []);

  const handleBack = React.useCallback(() => {
    if (
      selectedRoomTab === 'PAYMENT' &&
      paymentTabRef.current?.canGoBack()
    ) {
      paymentTabRef.current.goBack();
      return;
    }

    let previousTab: RoomMainTab | null = null;

    setRoomTabHistory((currentHistory) => {
      if (currentHistory.length === 0) {
        return currentHistory;
      }

      previousTab = currentHistory[currentHistory.length - 1];
      return currentHistory.slice(0, -1);
    });

    if (previousTab != null) {
      setSelectedRoomTab(previousTab);
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, selectedRoomTab]);

  if (viewMode === 'TRANSFER') {
    return <RoomSettlementTransferView onBack={() => setViewMode('SUMMARY')} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        titleWidget={
          <Text style={styles.summaryRoomTitle}>{room?.roomName ?? '모임 상세'}</Text>
        }
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
            onPress={() =>
              navigation.navigate('RoomMoreOptions', { roomId: room.roomId })
            }
          >
            <MaterialDesignIcons
              name="dots-horizontal"
              size={24 * s}
              color={AppColorStyles.black}
            />
          </TouchableOpacity>,
        ]}
      />

      <View style={styles.roomTabContainer}>
        {ROOM_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={styles.roomTabButton}
            activeOpacity={0.85}
            onPress={() => handleSelectRoomTab(tab.key)}
          >
            <Text
              style={
                selectedRoomTab === tab.key
                  ? styles.roomTabActive
                  : styles.roomTabInactive
              }
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.roomTabTrack} />
        <View
          style={[
            styles.roomTabIndicator,
            {
              width: `${100 / ROOM_TABS.length}%`,
              left: `${(100 / ROOM_TABS.length) * selectedRoomTabIndex}%`,
            },
          ]}
        />
      </View>

      {selectedRoomTab === 'PAYMENT' ? (
        <PaymentTabContent ref={paymentTabRef} roomId={room.roomId} />
      ) : selectedRoomTab === 'SETTLEMENT' ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={settlementRefreshing}
              onRefresh={handleSettlementRefresh}
              tintColor={AppColorStyles.black}
            />
          }
        >
          <TouchableOpacity
            style={styles.expectedCard}
            activeOpacity={0.85}
            onPress={() => setViewMode('TRANSFER')}
          >
            <Text style={styles.expectedLabel}>내 예상 금액</Text>
            <Text style={styles.expectedAmount}>{toWon(expectedAmount)}</Text>
            <View style={styles.expectedBottomRow}>
              <Text style={styles.expectedHint}>금액이 변동될 수 있어요</Text>
              <View style={styles.expectedActionBadge}>
                <Text style={styles.expectedAction}>탭하여 정산하기 →</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={[styles.sectionCard, styles.sectionCardSpacing]}>
            <Text style={styles.sectionTitle}>내가 참여한 결제</Text>
            {participatedPayments.length > 0 ? (
              participatedPayments.map((item, index) => (
                <SettlementRowCard
                  key={item.id}
                  item={item}
                  isLast={index === participatedPayments.length - 1}
                />
              ))
            ) : (
              <View style={styles.sectionEmptyBox}>
                <Text style={styles.emptyText}>결제 목록이 없습니다</Text>
              </View>
            )}
          </View>

          <View style={[styles.sectionCard, styles.sectionCardBottomSpacing]}>
            <Text style={styles.sectionTitle}>정산 요청 목록</Text>
            {settlementRequests.length > 0 ? (
              settlementRequests.map((item, index) => (
                <SettlementRowCard
                  key={item.id}
                  item={item}
                  isLast={index === settlementRequests.length - 1}
                />
              ))
            ) : (
              <View style={styles.sectionEmptyBox}>
                <Text style={styles.emptyText}>정산 목록이 없습니다</Text>
              </View>
            )}
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>모임 전체 합계</Text>
            <Text style={styles.totalAmount}>{toWon(room?.totalPay ?? 0)}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderCard}>
            <Text style={styles.sectionTitle}>순위</Text>
            <Text style={styles.placeholderDescription}>
              순위 탭은 모임 활동 규칙이 정리된 뒤 연결합니다.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
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
    backgroundColor: AppColorStyles.gray2,
  },
  roomTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 5 * s,
    backgroundColor: AppColorStyles.black,
    borderRadius: 4 * s,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  placeholderContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  placeholderCard: {
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  placeholderDescription: {
    marginTop: 10,
    ...PretendardTextStyle.medium({
      fontSize: 13,
      lineHeight: 20,
      color: AppColorStyles.textSecondary,
    }),
  },
  expectedCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  expectedLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 14 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
  expectedAmount: {
    marginTop: 10,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 26 * s,
      lineHeight: 26 * s,
      color: AppColorStyles.black,
    }),
  },
  expectedBottomRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expectedHint: {
    ...PretendardTextStyle.medium({
      fontSize: 12,
      color: AppColorStyles.textHint,
    }),
  },
  expectedActionBadge: {
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expectedAction: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 14 * s,
      color: AppColorStyles.black,
    }),
  },
  sectionCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  sectionCardSpacing: {
    marginBottom: 8,
  },
  sectionCardBottomSpacing: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 12,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.black,
    }),
  },
  sectionEmptyBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 14,
      color: AppColorStyles.gray2,
    }),
  },
  totalCard: {
    height: 72,
    backgroundColor: AppColorStyles.gray1,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.white,
    }),
  },
  totalAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22 * s,
      lineHeight: 22 * s,
      color: AppColorStyles.white,
    }),
  },
});
