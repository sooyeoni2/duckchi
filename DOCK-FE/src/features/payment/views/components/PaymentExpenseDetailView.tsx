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
  onBack: () => void;
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
    return '일시 미정';
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

/**
 * 목록 카드에서 진입한 상세내역 mock 화면.
 * 실제 API 전에도 어떤 정보를 사용자에게 보여줄지 섹션 단위로 검토할 수 있게 만든다.
 */
export function PaymentExpenseDetailView({
  expense,
  onBack,
}: PaymentExpenseDetailViewProps) {
  return (
    <View>
      <View style={styles.heroCard}>
        <Text
          style={PretendardTextStyle.semiBold({
            fontSize: 13,
            color: AppColorStyles.textSecondary,
          })}
        >
          상세내역
        </Text>
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
          <InfoRow label="결제 상태" value={STATUS_LABEL[expense.status]} />
          <InfoRow label="입력 방식" value={INPUT_TYPE_LABEL[expense.inputType]} />
          <InfoRow label="참여 인원" value={`${expense.participantCount}명`} />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          참여 인원
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
                        ? '정산 완료'
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

      {expense.lineItems.length > 0 && (
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
                  {`분배 대상: ${item.assignedParticipants.join(', ')}`}
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

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBack}
        style={styles.backButton}
      >
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
        >
          결제 목록으로 돌아가기
        </Text>
      </TouchableOpacity>
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
  backButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
