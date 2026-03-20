import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type {
  OcrLineItemDraft,
  OcrParticipantDraft,
  OcrReceiptDraft,
} from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentOcrMenuSplitViewProps {
  draft: OcrReceiptDraft;
  participants: OcrParticipantDraft[];
  remainingUnassignedAmount: number;
  onOpenAssignSheet: (itemId: number) => void;
  onClearAssignment: (itemId: number) => void;
  onSubmit: () => void;
}

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

function getAssignedParticipantNames(
  item: OcrLineItemDraft,
  participants: OcrParticipantDraft[],
): string {
  if (item.assignment == null) {
    return '';
  }

  const assignedNames = participants
    .filter((participant) =>
      item.assignment?.participantUserIds.includes(participant.userId),
    )
    .map((participant) => participant.userName.replace(' (나)', ''));

  if (assignedNames.length === 0) {
    return '참여자 없음';
  }

  if (assignedNames.length <= 2) {
    return assignedNames.join(', ');
  }

  return `${assignedNames[0]} 외 ${assignedNames.length - 1}명`;
}

export function PaymentOcrMenuSplitView({
  draft,
  participants,
  remainingUnassignedAmount,
  onOpenAssignSheet,
  onClearAssignment,
  onSubmit,
}: PaymentOcrMenuSplitViewProps) {
  const unassignedItems = draft.items.filter((item) => item.assignment == null);
  const assignedItems = draft.items.filter((item) => item.assignment != null);
  const perPersonHint =
    participants.length > 0
      ? Math.floor(remainingUnassignedAmount / participants.length)
      : 0;

  return (
    <View>
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeText}>
          지정하지 않은 메뉴는 자동으로 나눠져요
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>총 금액</Text>
        <Text style={styles.summaryAmount}>{formatAmount(draft.totalAmount)}</Text>
        <Text style={styles.summaryMeta}>
          {`${draft.storeName} · ${draft.items.length}건`}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>미지정 메뉴</Text>

        <View style={styles.sectionBody}>
          {unassignedItems.length === 0 ? (
            <Text style={styles.emptyText}>모든 메뉴의 참여자 지정이 완료됐어요.</Text>
          ) : (
            unassignedItems.map((item) => (
              <View key={item.itemId} style={styles.unassignedRow}>
                <View style={styles.itemMetaColumn}>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>

                <Text style={styles.itemPrice}>
                  {formatAmount(item.unitPrice)}
                </Text>

                <Text style={styles.itemQuantity}>{item.quantity}</Text>

                <PaymentAnimatedTouchable
                  activeOpacity={0.85}
                  onPress={() => onOpenAssignSheet(item.itemId)}
                  style={styles.assignButton}
                >
                  <Text style={styles.assignButtonText}>+ 인원 선택</Text>
                </PaymentAnimatedTouchable>
              </View>
            ))
          )}

          <View style={styles.remainingCard}>
            <Text style={styles.remainingLabel}>남은 미지정 금액</Text>

            <View style={styles.remainingValueWrap}>
              <Text style={styles.remainingAmount}>
                {formatAmount(remainingUnassignedAmount)}
              </Text>
              <Text style={styles.remainingHint}>
                {participants.length > 0 ? `${formatAmount(perPersonHint)}/인` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>지정 완료 메뉴</Text>

        <View style={styles.sectionBody}>
          {assignedItems.length === 0 ? (
            <View style={styles.emptyAssignedCard}>
              <Text style={styles.emptyAssignedText}>
                지정 완료 된 메뉴가 없습니다
              </Text>
            </View>
          ) : (
            assignedItems.map((item) => (
              <View key={item.itemId} style={styles.assignedCard}>
                <View style={styles.assignedHeader}>
                  <Text style={styles.assignedItemName}>{item.name}</Text>
                  <Text style={styles.assignedAmount}>{formatAmount(item.amount)}</Text>
                </View>

                <Text style={styles.assignedMeta}>
                  {item.assignment?.mode === 'QUANTITY'
                    ? `수량별 배정 · ${getAssignedParticipantNames(item, participants)}`
                    : `인원별 N빵 · ${getAssignedParticipantNames(item, participants)}`}
                </Text>

                <View style={styles.assignedActionRow}>
                  <PaymentAnimatedTouchable
                    activeOpacity={0.85}
                    onPress={() => onOpenAssignSheet(item.itemId)}
                    style={[styles.smallActionButton, styles.editButton]}
                  >
                    <Text style={styles.editButtonText}>수정</Text>
                  </PaymentAnimatedTouchable>

                  <PaymentAnimatedTouchable
                    activeOpacity={0.85}
                    onPress={() => onClearAssignment(item.itemId)}
                    style={[styles.smallActionButton, styles.deleteButton]}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </PaymentAnimatedTouchable>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        onPress={onSubmit}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>장바구니 담기</Text>
      </PaymentAnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeBanner: {
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColorStyles.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noticeText: {
    ...PretendardTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.textHint,
    }),
  },
  summaryCard: {
    paddingHorizontal: 18,
    paddingVertical: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 18,
  },
  summaryLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textHint,
    }),
  },
  summaryAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
    marginTop: 10,
  },
  summaryMeta: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.textHint,
    }),
    marginTop: 10,
  },
  sectionCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  sectionBody: {
    marginTop: 16,
  },
  emptyText: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      lineHeight: 22,
      color: AppColorStyles.textSecondary,
    }),
  },
  unassignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemMetaColumn: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.black,
    }),
  },
  itemPrice: {
    ...PretendardTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.gray1,
    }),
    width: 88,
    textAlign: 'right',
    marginRight: 12,
  },
  itemQuantity: {
    ...PretendardTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.gray1,
    }),
    width: 24,
    textAlign: 'center',
    marginRight: 12,
  },
  assignButton: {
    minWidth: 84,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: AppColorStyles.gray4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 12,
      color: AppColorStyles.black,
    }),
  },
  remainingCard: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textHint,
    }),
  },
  remainingValueWrap: {
    alignItems: 'flex-end',
  },
  remainingAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
  },
  remainingHint: {
    ...PretendardTextStyle.medium({
      fontSize: 12,
      color: AppColorStyles.textHint,
    }),
    marginTop: 4,
  },
  emptyAssignedCard: {
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: AppColorStyles.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAssignedText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textDisabled,
    }),
  },
  assignedCard: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
  },
  assignedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignedItemName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  assignedAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  assignedMeta: {
    ...PretendardTextStyle.medium({
      fontSize: 13,
      lineHeight: 20,
      color: AppColorStyles.textSecondary,
    }),
    marginTop: 10,
  },
  assignedActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  smallActionButton: {
    minWidth: 60,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  editButton: {
    borderWidth: 1,
    borderColor: AppColorStyles.gray1,
    marginRight: 8,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: AppColorStyles.warning,
  },
  editButtonText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 12,
      color: AppColorStyles.gray1,
    }),
  },
  deleteButtonText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 12,
      color: AppColorStyles.warning,
    }),
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
  },
});
