import React from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';

import type { RoomSettlementRow } from '../../models/roomSettlementOverviewTypes';
import { SettlementRowCard } from '../components/SettlementRowCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

interface RoomSettlementOverviewScreenProps {
  expectedAmount: number;
  totalAmount: number;
  participatedPayments: RoomSettlementRow[];
  settlementRequests: RoomSettlementRow[];
  errorMessage?: string;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onOpenTransfer: () => void;
  onOpenSettlementDetail: (expenseId: number) => void;
  onOpenSettlementRequestList: (item: RoomSettlementRow) => void;
}

export function RoomSettlementOverviewScreen({
  expectedAmount,
  totalAmount,
  participatedPayments,
  settlementRequests,
  errorMessage,
  refreshing,
  onRefresh,
  onOpenTransfer,
  onOpenSettlementDetail,
  onOpenSettlementRequestList,
}: RoomSettlementOverviewScreenProps) {
  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={(
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={AppColorStyles.black}
        />
      )}
    >
      <View style={styles.expectedCard}>
        <Text style={styles.expectedLabel}>예상 금액</Text>
        <Text style={styles.expectedAmount}>{toWon(expectedAmount)}</Text>
        <View style={styles.expectedBottomRow}>
          <Text style={styles.expectedHint}>금액은 변경할 수 있어요.</Text>
          <TouchableOpacity
            // 사용자가 누르는 실제 CTA(정산하기)에 직접 이동 핸들러를 연결한다.
            onPress={onOpenTransfer}
            activeOpacity={0.85}
            style={styles.expectedActionBadge}
          >
            <Text style={styles.expectedAction}>정산하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {errorMessage != null && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={[styles.sectionCard, styles.sectionCardSpacing]}>
        <Text style={styles.sectionTitle}>내가 참여한 결제</Text>
        {participatedPayments.length > 0 ? (
          participatedPayments.map((item, index) => (
            <SettlementRowCard
              key={item.id}
              item={item}
              isLast={index === participatedPayments.length - 1}
              onPress={() => onOpenSettlementDetail(item.id)}
            />
          ))
        ) : (
          <View style={styles.sectionEmptyBox}>
            <Text style={styles.emptyText}>참여 중인 결제가 없습니다.</Text>
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
              // 정산 요청 목록 카드는 클릭한 expense 기준으로 상세 목록을 열어야 한다.
              onPress={() => onOpenSettlementRequestList(item)}
            />
          ))
        ) : (
          <View style={styles.sectionEmptyBox}>
            <Text style={styles.emptyText}>정산 요청이 없습니다.</Text>
          </View>
        )}
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>모임 전체 합계</Text>
        <Text style={styles.totalAmount}>{toWon(totalAmount)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21 * s,
    paddingTop: 20 * s,
    paddingBottom: 32 * s,
  },
  expectedCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18 * s,
    paddingHorizontal: 16 * s,
    paddingTop: 20 * s,
    paddingBottom: 16 * s,
    marginBottom: 8 * s,
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
    marginTop: 10 * s,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 26 * s,
      lineHeight: 26 * s,
      color: AppColorStyles.black,
    }),
  },
  expectedBottomRow: {
    marginTop: 16 * s,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expectedHint: {
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      color: AppColorStyles.textHint,
    }),
  },
  expectedActionBadge: {
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 10 * s,
    paddingHorizontal: 10 * s,
    paddingVertical: 5 * s,
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
    borderRadius: 18 * s,
    paddingHorizontal: 16 * s,
    paddingTop: 20 * s,
    paddingBottom: 16 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  sectionCardSpacing: {
    marginBottom: 8 * s,
  },
  errorBox: {
    marginBottom: 8 * s,
    borderRadius: 12 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    backgroundColor: AppColorStyles.surface,
    paddingVertical: 10 * s,
    paddingHorizontal: 12 * s,
  },
  errorText: {
    ...PretendardTextStyle.medium({
      fontSize: 12 * s,
      lineHeight: 18 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
  sectionCardBottomSpacing: {
    marginBottom: 8 * s,
  },
  sectionTitle: {
    marginBottom: 12 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.black,
    }),
  },
  sectionEmptyBox: {
    paddingVertical: 20 * s,
    paddingHorizontal: 16 * s,
    borderRadius: 14 * s,
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
      fontSize: 14 * s,
      color: AppColorStyles.gray2,
    }),
  },
  totalCard: {
    height: 72 * s,
    backgroundColor: AppColorStyles.gray1,
    borderRadius: 18 * s,
    paddingHorizontal: 16 * s,
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
