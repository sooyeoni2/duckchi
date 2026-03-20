import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { MyExpenseDetail } from '../../models/paymentTypes';

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
  PENDING: '정산 전',
  REQUESTED: '요청됨',
  SETTLED: '완료',
};

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '시간 정보 없음';
  }

  const month = date.getMonth() + 1;
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${month}.${day} ${hour}:${minute}`;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text
        style={PretendardTextStyle.medium({
          fontSize: 13,
          color: AppColorStyles.textSecondary,
        })}
      >
        {label}
      </Text>
      <Text
        style={PretendardTextStyle.semiBold({
          fontSize: 13,
          color: AppColorStyles.black,
        })}
      >
        {value}
      </Text>
    </View>
  );
}

export function PaymentExpenseDetailView({
  expense,
  onEdit,
  onCancel,
  editDisabled = false,
  cancelDisabled = false,
  actionHelperMessage = null,
}: PaymentExpenseDetailViewProps) {
  const shouldShowLineItems =
    expense.inputType === 'OCR' && expense.lineItems.length > 0;
  const shouldShowSourceInfo =
    expense.sourceInfoRows != null && expense.sourceInfoRows.length > 0;
  const canShowAnyAction = !editDisabled || !cancelDisabled;

  return (
    <View>
      <View style={styles.heroCard}>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 24,
            color: AppColorStyles.black,
          })}
        >
          {expense.title}
        </Text>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 28,
            color: AppColorStyles.gray1,
          })}
        >
          {formatAmount(expense.totalAmount)}
        </Text>
        <Text
          style={PretendardTextStyle.regular({
            fontSize: 14,
            lineHeight: 22,
            color: AppColorStyles.textSecondary,
          })}
        >
          {`${expense.storeName} · ${formatDate(expense.paidAt)}`}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          기본 정보
        </Text>
        <View style={styles.sectionBody}>
          <InfoRow label="정산 상태" value={STATUS_LABEL[expense.status]} />
          <InfoRow label="등록 방식" value={INPUT_TYPE_LABEL[expense.inputType]} />
          <InfoRow label="참여 인원" value={`${expense.participantCount}명`} />
        </View>
      </View>

      {shouldShowSourceInfo && (
        <View style={styles.sectionCard}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            원본 정보
          </Text>
          <View style={styles.sectionBody}>
            {expense.sourceInfoRows?.map((row) => (
              <InfoRow
                key={`${row.label}-${row.value}`}
                label={row.label}
                value={row.value}
              />
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          참여자 설정
        </Text>
        <View style={styles.sectionBody}>
          {expense.participants.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <Text
                  style={KBODiaGothicTextStyle.medium({
                    fontSize: 16,
                    color: AppColorStyles.black,
                  })}
                >
                  {participant.userName}
                </Text>
                <View
                  style={[
                    styles.statusChip,
                    participant.isRequester && styles.requesterChip,
                    participant.isSettled && styles.settledChip,
                  ]}
                >
                  <Text
                    style={PretendardTextStyle.semiBold({
                      fontSize: 11,
                      color: AppColorStyles.black,
                    })}
                  >
                    {participant.isRequester
                      ? '요청자'
                      : participant.isSettled
                        ? '완료'
                        : '대기'}
                  </Text>
                </View>
              </View>
              <Text
                style={KBODiaGothicTextStyle.bold({
                  fontSize: 16,
                  color: AppColorStyles.gray1,
                })}
              >
                {formatAmount(participant.splitAmount)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {shouldShowLineItems && (
        <View style={styles.sectionCard}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            세부 품목
          </Text>
          <View style={styles.sectionBody}>
            {expense.lineItems.map((item) => (
              <View key={item.itemId} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <Text
                    style={KBODiaGothicTextStyle.medium({
                      fontSize: 16,
                      color: AppColorStyles.black,
                    })}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={PretendardTextStyle.semiBold({
                      fontSize: 13,
                      color: AppColorStyles.textSecondary,
                    })}
                  >
                    {`${item.quantity}개`}
                  </Text>
                </View>
                <Text
                  style={KBODiaGothicTextStyle.bold({
                    fontSize: 16,
                    color: AppColorStyles.gray1,
                  })}
                >
                  {formatAmount(item.amount)}
                </Text>
                <Text
                  style={PretendardTextStyle.regular({
                    fontSize: 13,
                    lineHeight: 20,
                    color: AppColorStyles.textSecondary,
                  })}
                >
                  {`배정 참여자 · ${item.assignedParticipants.join(', ')}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          메모
        </Text>
        <View style={styles.sectionBody}>
          <Text
            style={PretendardTextStyle.regular({
              fontSize: 14,
              lineHeight: 22,
              color: AppColorStyles.textSecondary,
            })}
          >
            {expense.memo}
          </Text>
        </View>
      </View>

      {canShowAnyAction && (
        <View style={styles.actionRow}>
          {!editDisabled && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onEdit}
              style={[styles.actionButton, styles.editButton]}
            >
              <Text
                style={KBODiaGothicTextStyle.bold({
                  fontSize: 18,
                  color: AppColorStyles.black,
                })}
              >
                수정하기
              </Text>
            </TouchableOpacity>
          )}

          {!cancelDisabled && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCancel}
              style={[
                styles.actionButton,
                styles.cancelButton,
                !editDisabled && styles.cancelButtonSpacing,
              ]}
            >
              <Text
                style={KBODiaGothicTextStyle.bold({
                  fontSize: 18,
                  color: AppColorStyles.black,
                })}
              >
                취소하기
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {actionHelperMessage != null && (
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 13,
            lineHeight: 20,
            color: AppColorStyles.textSecondary,
          })}
        >
          {actionHelperMessage}
        </Text>
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
  sectionCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
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
  itemCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: AppColorStyles.gray5,
    marginBottom: 10,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: AppColorStyles.yellow,
  },
  cancelButtonSpacing: {
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 2,
    borderColor: AppColorStyles.yellow,
  },
});
