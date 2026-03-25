import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
} from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import {
  defaultPaymentContentLayoutState,
  type PaymentContentLayoutState,
} from '../../payment/models/paymentContentLayout';
import { getExpenseDetail } from '../../payment/models/paymentService';
import { PaymentEntryMethodTabs } from '../../payment/views/components/PaymentEntryMethodTabs';
import type { PaymentTabContentHandle } from '../../payment/views/components/PaymentTabContent';
import {
  roomParticipatedPaymentsMock,
  roomSettlementRequestsMock,
} from '../models/roomDetailMockData';
import { meetingRoomMockData } from '../models/roomMockData';
import { useRoomStore } from '../models/roomStore';
import { RoomPaymentTabScreen } from './screens/RoomPaymentTabScreen';
import { RoomRankingTabScreen } from './screens/RoomRankingTabScreen';
import type { SettlementDetailState } from './screens/RoomSettlementDetailScreen';
import { RoomSettlementTabScreen } from './screens/RoomSettlementTabScreen';
import { RoomSettlementTransferScreen } from './screens/RoomSettlementTransferScreen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const ROOM_TABS = [
  { key: 'PAYMENT', label: '결제' },
  { key: 'SETTLEMENT', label: '정산' },
  { key: 'RANKING', label: '순위' },
] as const;

type RoomViewMode = 'SUMMARY' | 'TRANSFER';
type RoomMainTab = (typeof ROOM_TABS)[number]['key'];

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
  const [paymentLayoutState, setPaymentLayoutState] =
    useState<PaymentContentLayoutState>(defaultPaymentContentLayoutState);
  const [_roomTabHistory, setRoomTabHistory] = useState<RoomMainTab[]>([]);
  const [settlementDetailState, setSettlementDetailState] =
    useState<SettlementDetailState>({
      status: 'idle',
    });
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
  const isSettlementDetailOpen = settlementDetailState.status !== 'idle';

  React.useEffect(() => {
    if (settlementDetailState.status !== 'loading') {
      return;
    }

    let cancelled = false;

    void getExpenseDetail(settlementDetailState.expenseId)
      .then((detail) => {
        if (cancelled) {
          return;
        }

        setSettlementDetailState({
          status: 'loaded',
          expenseId: settlementDetailState.expenseId,
          detail,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setSettlementDetailState({
          status: 'error',
          expenseId: settlementDetailState.expenseId,
          message:
            error instanceof Error
              ? error.message
              : '상세 내역을 불러오지 못했습니다.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [settlementDetailState]);

  const handleSelectRoomTab = React.useCallback(
    (nextTab: RoomMainTab) => {
      if (selectedRoomTab === nextTab) {
        return;
      }

      if (selectedRoomTab === 'PAYMENT' || nextTab === 'PAYMENT') {
        setPaymentLayoutState(defaultPaymentContentLayoutState);
      }

      if (selectedRoomTab === 'SETTLEMENT' && nextTab !== 'SETTLEMENT') {
        setSettlementDetailState({ status: 'idle' });
      }

      setRoomTabHistory((previousHistory) => [...previousHistory, selectedRoomTab]);
      setSelectedRoomTab(nextTab);
    },
    [selectedRoomTab],
  );

  const handleOpenSettlementDetail = React.useCallback((expenseId: number) => {
    setSettlementDetailState({
      status: 'loading',
      expenseId,
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

    if (selectedRoomTab === 'SETTLEMENT' && isSettlementDetailOpen) {
      setSettlementDetailState({ status: 'idle' });
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
  }, [isSettlementDetailOpen, navigation, selectedRoomTab]);

  if (viewMode === 'TRANSFER') {
    return <RoomSettlementTransferScreen onBack={() => setViewMode('SUMMARY')} />;
  }

  const shouldUsePaymentAppBar =
    selectedRoomTab === 'PAYMENT' && paymentLayoutState.headerTitle != null;
  const shouldUseSettlementDetailAppBar =
    selectedRoomTab === 'SETTLEMENT' && isSettlementDetailOpen;
  const appBarTitle = shouldUsePaymentAppBar
    ? paymentLayoutState.headerTitle
    : shouldUseSettlementDetailAppBar
      ? '상세 내역'
      : room?.roomName ?? '모임 상세';
  const showRoomActions =
    !shouldUseSettlementDetailAppBar &&
    (selectedRoomTab !== 'PAYMENT' || paymentLayoutState.showRoomActions);
  const handleRetrySettlementDetail = React.useCallback((expenseId: number) => {
    setSettlementDetailState({
      status: 'loading',
      expenseId,
    });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        titleWidget={<Text style={styles.summaryRoomTitle}>{appBarTitle}</Text>}
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={handleBack}
        actions={
          showRoomActions
            ? [
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
              ]
            : undefined
        }
      />

      {selectedRoomTab === 'PAYMENT' &&
      paymentLayoutState.topTabMode === 'ENTRY' ? (
        <PaymentEntryMethodTabs
          activeTab={paymentLayoutState.activeEntryTab ?? 'ACCOUNT_HISTORY'}
          onChange={(nextTab) => paymentTabRef.current?.selectEntryTab(nextTab)}
        />
      ) : (selectedRoomTab !== 'PAYMENT' ||
          paymentLayoutState.topTabMode === 'ROOM') &&
        !shouldUseSettlementDetailAppBar ? (
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
      ) : null}

      {selectedRoomTab === 'PAYMENT' ? (
        <RoomPaymentTabScreen
          roomId={room.roomId}
          paymentTabRef={paymentTabRef}
          onLayoutChange={setPaymentLayoutState}
        />
      ) : selectedRoomTab === 'SETTLEMENT' ? (
        <RoomSettlementTabScreen
          isSettlementDetailOpen={isSettlementDetailOpen}
          settlementDetailState={settlementDetailState}
          settlementRefreshing={settlementRefreshing}
          expectedAmount={expectedAmount}
          totalAmount={room?.totalPay ?? 0}
          participatedPayments={participatedPayments}
          settlementRequests={settlementRequests}
          onRefresh={handleSettlementRefresh}
          onOpenSettlementDetail={handleOpenSettlementDetail}
          onOpenTransfer={() => setViewMode('TRANSFER')}
          onRetrySettlementDetail={handleRetrySettlementDetail}
        />
      ) : (
        <RoomRankingTabScreen />
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
});
