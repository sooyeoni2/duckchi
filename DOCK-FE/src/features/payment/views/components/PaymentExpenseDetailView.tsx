import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

import type {
  ExpenseLineItemAssignmentDetail,
  ExpenseLineItemPreview,
  MyExpenseDetail,
} from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentExpenseDetailViewProps {
  expense: MyExpenseDetail;
  onEdit: () => void;
  onCancel: () => void;
  editDisabled?: boolean;
  cancelDisabled?: boolean;
  actionHelperMessage?: string | null;
}

interface InfoRowProps {
  label: string;
  value: string;
}

const INPUT_TYPE_LABEL: Record<MyExpenseDetail['inputType'], string> = {
  ACCOUNT_HISTORY: '계좌 내역',
  OCR: '영수증 OCR',
  MANUAL: '직접 입력',
};

const STATUS_LABEL: Record<MyExpenseDetail['status'], string> = {
  PENDING: '대기',
  REQUESTED: '진행중',
  SETTLED: '완료',
};

const formatAmount = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '시간 정보 없음';
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${month}.${day} ${hour}:${minute}`;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function buildFallbackBreakdown(
  item: ExpenseLineItemPreview,
): ExpenseLineItemAssignmentDetail[] {
  if (item.assignedParticipants.length === 0) {
    return [];
  }

  const participantCount = item.assignedParticipants.length;
  const baseAmount = Math.floor(item.amount / participantCount);
  const amountRemainder = item.amount % participantCount;
  const baseQuantity = Math.floor(item.quantity / participantCount);
  const quantityRemainder = item.quantity % participantCount;

  return item.assignedParticipants.map((userName, index) => ({
    userId: index + 1,
    userName,
    quantity: baseQuantity + (index < quantityRemainder ? 1 : 0),
    amount: baseAmount + (index < amountRemainder ? 1 : 0),
  }));
}

function getLineItemBreakdown(
  item: ExpenseLineItemPreview,
): ExpenseLineItemAssignmentDetail[] {
  if (item.assignmentDetails != null && item.assignmentDetails.length > 0) {
    return item.assignmentDetails;
  }

  return buildFallbackBreakdown(item);
}

function isEqualSplitBreakdown(
  breakdowns: ExpenseLineItemAssignmentDetail[],
): boolean {
  return breakdowns.length > 0 && breakdowns.every((detail) => detail.quantity === 0);
}

export function PaymentExpenseDetailView({
  expense,
  onEdit,
  onCancel,
  editDisabled = false,
  cancelDisabled = false,
}: PaymentExpenseDetailViewProps) {
  const [expandedItemId, setExpandedItemId] = React.useState<number | null>(null);

  const shouldShowLineItems =
    expense.inputType === 'OCR' && expense.lineItems.length > 0;
  const shouldShowSourceInfo =
    expense.sourceInfoRows != null && expense.sourceInfoRows.length > 0;
  const canShowAnyAction = !editDisabled || !cancelDisabled;
  const actionHelperMessage =
    expense.status === 'REQUESTED'
      ? '이미 정산 요청이 진행 중인 결제안은 수정하거나 삭제할 수 없어요.'
      : null;

  const toggleLineItem = (itemId: number) => {
    setExpandedItemId((currentId) => (currentId === itemId ? null : itemId));
  };

  return (
    <View>
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>{expense.title}</Text>
        <Text style={styles.heroAmount}>{formatAmount(expense.totalAmount)}</Text>
        <Text style={styles.heroMeta}>{`${expense.storeName} · ${formatDate(expense.paidAt)}`}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        <View style={styles.sectionBody}>
          <InfoRow label="정산 상태" value={STATUS_LABEL[expense.status]} />
          <InfoRow label="등록 방식" value={INPUT_TYPE_LABEL[expense.inputType]} />
          <InfoRow label="참여 인원" value={`${expense.participantCount}명`} />
        </View>
      </View>

      {shouldShowSourceInfo && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>원본 정보</Text>
          <View style={styles.sectionBody}>
            {expense.sourceInfoRows?.map((row) => (
              <InfoRow key={`${row.label}-${row.value}`} label={row.label} value={row.value} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>참여자 설정</Text>
        <View style={styles.sectionBody}>
          {expense.participants.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{participant.userName}</Text>
                <View
                  style={[
                    styles.statusChip,
                    participant.isRequester && styles.requesterChip,
                    participant.isSettled && styles.settledChip,
                  ]}
                >
                  <Text style={styles.statusChipText}>
                    {participant.isRequester
                      ? '요청자'
                      : participant.isSettled
                        ? '완료'
                        : '대기'}
                  </Text>
                </View>
              </View>
              <Text style={styles.participantAmount}>{formatAmount(participant.splitAmount)}</Text>
            </View>
          ))}
        </View>
      </View>

      {shouldShowLineItems && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>세부 품목</Text>
          <View style={styles.sectionBody}>
            {expense.lineItems.map((item) => {
              const isExpanded = expandedItemId === item.itemId;
              const breakdowns = getLineItemBreakdown(item);
              const isEqualSplit = isEqualSplitBreakdown(breakdowns);
              const equalSplitAmount =
                breakdowns.length > 0
                  ? Math.floor(item.amount / breakdowns.length)
                  : item.amount;

              return (
                <View key={item.itemId} style={styles.itemCard}>
                  <PaymentAnimatedTouchable
                    variant="card"
                    activeOpacity={0.9}
                    onPress={() => toggleLineItem(item.itemId)}
                    style={styles.itemPressable}
                  >
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemMetaColumn}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemSubMeta}>
                          {`${item.quantity}개 · ${item.assignedParticipants.join(', ')}`}
                        </Text>
                      </View>

                      <View style={styles.itemAmountWrap}>
                        <Text style={styles.itemAmount}>{formatAmount(item.amount)}</Text>
                        <MaterialDesignIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={AppColorStyles.gray2}
                        />
                      </View>
                    </View>
                  </PaymentAnimatedTouchable>

                  {isExpanded && breakdowns.length > 0 && (
                    <View style={styles.breakdownList}>
                      {isEqualSplit ? (
                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownName}>공통 N빵</Text>
                          <Text style={styles.breakdownMeta}>
                            {`${breakdowns.length}명 · 1인 ${formatAmount(equalSplitAmount)}`}
                          </Text>
                        </View>
                      ) : (
                        breakdowns.map((detail) => (
                          <View
                            key={`${item.itemId}-${detail.userId}-${detail.userName}`}
                            style={styles.breakdownRow}
                          >
                            <Text style={styles.breakdownName}>{detail.userName}</Text>
                            <Text style={styles.breakdownMeta}>
                              {`${detail.quantity}개 · ${formatAmount(detail.amount)}`}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>메모</Text>
        <View style={styles.sectionBody}>
          <Text style={styles.memoText}>{expense.memo}</Text>
        </View>
      </View>

      {canShowAnyAction && (
        <View style={styles.actionRow}>
          {!editDisabled && (
            <PaymentAnimatedTouchable
              activeOpacity={0.85}
              onPress={onEdit}
              wrapperStyle={styles.actionButtonWrap}
              style={[styles.actionButton, styles.editButton]}
            >
              <Text style={styles.editButtonText}>수정하기</Text>
            </PaymentAnimatedTouchable>
          )}

          {!cancelDisabled && (
            <PaymentAnimatedTouchable
              activeOpacity={0.85}
              onPress={onCancel}
              wrapperStyle={[
                styles.actionButtonWrap,
                !editDisabled && styles.cancelButtonSpacing,
              ]}
              style={[styles.actionButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>삭제하기</Text>
            </PaymentAnimatedTouchable>
          )}
        </View>
      )}

      {actionHelperMessage != null && (
        <Text style={styles.actionHelperText}>{actionHelperMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  heroTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24,
      color: AppColorStyles.black,
    }),
  },
  heroAmount: {
    marginTop: 10,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 28,
      color: AppColorStyles.gray1,
    }),
  },
  heroMeta: {
    marginTop: 10,
    ...PretendardTextStyle.regular({
      fontSize: 14,
      lineHeight: 22,
      color: AppColorStyles.textSecondary,
    }),
  },
  sectionCard: {
    padding: 18,
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
    marginTop: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    ...PretendardTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.textSecondary,
    }),
  },
  infoValue: {
    ...PretendardTextStyle.semiBold({
      fontSize: 13,
      color: AppColorStyles.black,
    }),
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  participantName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.black,
    }),
  },
  participantAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 16,
      color: AppColorStyles.gray1,
    }),
  },
  statusChip: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: AppColorStyles.gray4,
  },
  requesterChip: {
    backgroundColor: AppColorStyles.yellowLight,
  },
  settledChip: {
    backgroundColor: AppColorStyles.gray4,
  },
  statusChipText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 11,
      color: AppColorStyles.black,
    }),
  },
  itemCard: {
    borderRadius: 14,
    backgroundColor: AppColorStyles.gray5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  itemPressable: {
    padding: 14,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemMetaColumn: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.black,
    }),
  },
  itemSubMeta: {
    marginTop: 8,
    ...PretendardTextStyle.regular({
      fontSize: 13,
      lineHeight: 20,
      color: AppColorStyles.textSecondary,
    }),
  },
  itemAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAmount: {
    marginRight: 6,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 16,
      color: AppColorStyles.gray1,
    }),
  },
  breakdownList: {
    borderTopWidth: 1,
    borderTopColor: AppColorStyles.divider,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  breakdownName: {
    ...PretendardTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.black,
    }),
  },
  breakdownMeta: {
    ...PretendardTextStyle.semiBold({
      fontSize: 13,
      color: AppColorStyles.gray1,
    }),
  },
  memoText: {
    ...PretendardTextStyle.regular({
      fontSize: 14,
      lineHeight: 22,
      color: AppColorStyles.textSecondary,
    }),
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  actionButtonWrap: {
    flex: 1,
  },
  actionButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: AppColorStyles.yellow,
  },
  editButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  cancelButtonSpacing: {
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 2,
    borderColor: AppColorStyles.yellow,
  },
  cancelButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  actionHelperText: {
    marginTop: 8,
    marginBottom: 12,
    ...PretendardTextStyle.medium({
      fontSize: 13,
      lineHeight: 20,
      color: AppColorStyles.textSecondary,
    }),
  },
});
