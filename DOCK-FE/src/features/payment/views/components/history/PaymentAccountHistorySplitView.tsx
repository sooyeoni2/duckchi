import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { PaymentAccountHistoryDraftState } from '../../../viewmodels/usePaymentAccountHistoryViewModel';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

interface PaymentAccountHistorySplitViewProps {
  draftState: PaymentAccountHistoryDraftState;
  splitAmountTotal: number;
  onRetry: (historyId: string) => void;
  onParticipantAmountChange: (userId: number, text: string) => void;
  onSubmit: () => void;
}

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const formatDateTime = (dateSource: string | Date): string => {
  const date = typeof dateSource === 'string' ? new Date(dateSource) : dateSource;
  if (isNaN(date.getTime())) return '날짜 정보 없음';

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}`;
};

const toAmountInputValue = (amount: number): string =>
  amount > 0 ? String(amount) : '';

export function PaymentAccountHistorySplitView({
  draftState,
  splitAmountTotal,
  onRetry,
  onParticipantAmountChange,
  onSubmit,
}: PaymentAccountHistorySplitViewProps) {
  if (draftState.status === 'idle' || draftState.status === 'loading') {
    return (
      <View style={styles.centerCard}>
        <ActivityIndicator size="small" color={AppColorStyles.black} />
        <Text
          style={[
            PretendardTextStyle.medium({
              fontSize: 13,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            }),
            styles.messageText,
          ]}
        >
          참여자별 금액 입력 화면을 준비하는 중입니다.
        </Text>
      </View>
    );
  }

  if (draftState.status === 'error') {
    return (
      <View style={styles.centerCard}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 14,
            lineHeight: 20,
            color: AppColorStyles.textSecondary,
          })}
        >
          {draftState.message}
        </Text>
        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={() => onRetry((draftState as any).historyId || '')}
          style={styles.retryButton}
        >
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 14,
              color: AppColorStyles.black,
            })}
          >
            다시 불러오기
          </Text>
        </PaymentAnimatedTouchable>
      </View>
    );
  }

  const draft = draftState;
  const selectedParticipants = draft.participants.filter(
    (participant: any) => participant.isSelected,
  );
  const isSubmitDisabled =
    selectedParticipants.length === 0 || splitAmountTotal !== draft.totalAmount;

  return (
    <View>
      <View style={styles.summaryCard}>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 24,
            color: AppColorStyles.black,
          })}
        >
          {draft.transactionMemo}
        </Text>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.textHint,
            })}
          >
            거래 시각
          </Text>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.textHint,
            })}
          >
            {formatDateTime(draft.transactionAt)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.textHint,
            })}
          >
            거래 금액
          </Text>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.textHint,
            })}
          >
            {formatAmount(draft.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          정산 제목
        </Text>
        <View style={styles.readonlyField}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            {draft.title}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
        >
          금액
        </Text>
        <View style={styles.readonlyField}>
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 20,
              color: AppColorStyles.gray1,
            })}
          >
            {formatAmount(draft.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          금액 입력
        </Text>

        {selectedParticipants.map((participant: any) => (
          <View key={participant.userId} style={styles.participantRow}>
            <View style={styles.participantInfo}>
              {participant.profileImageUrl ? (
                <Image
                  source={{ uri: participant.profileImageUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarCircle}>
                  <MaterialDesignIcons
                    name="account-outline"
                    size={28}
                    color={AppColorStyles.gray2}
                  />
                </View>
              )}

              <View style={styles.participantNameRow}>
                <Text
                  style={KBODiaGothicTextStyle.medium({
                    fontSize: 18,
                    color: AppColorStyles.black,
                  })}
                >
                  {participant.userName}
                </Text>
                {participant.userTag && (
                  <Text style={styles.participantTag}>#{participant.userTag}</Text>
                )}
              </View>
            </View>

            <View style={styles.amountInputWrapper}>
              <TextInput
                value={toAmountInputValue(participant.splitAmount)}
                onChangeText={(text) =>
                  onParticipantAmountChange(participant.userId, text)
                }
                keyboardType="number-pad"
                textAlign="right"
                maxLength={10}
                style={[
                  KBODiaGothicTextStyle.bold({
                    fontSize: 18,
                    color: AppColorStyles.black,
                  }),
                  styles.amountInput,
                ]}
              />
              <Text
                style={KBODiaGothicTextStyle.medium({
                  fontSize: 16,
                  color: AppColorStyles.textSecondary,
                })}
              >
                원
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Text
        style={[
          PretendardTextStyle.medium({
            fontSize: 14,
            color: AppColorStyles.textSecondary,
          }),
          styles.helperText,
        ]}
      >
        금액은 수정할 수 있어요
      </Text>

      <View style={styles.totalCard}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.textHint,
          })}
        >
          전체 금액
        </Text>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 18,
            color:
              splitAmountTotal === draft.totalAmount
                ? AppColorStyles.black
                : AppColorStyles.danger,
          })}
        >
          {formatAmount(splitAmountTotal)}
        </Text>
      </View>

      {splitAmountTotal !== draft.totalAmount && (
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 13,
            color: AppColorStyles.danger,
          })}
        >
          전체 금액과 참여자 금액 합계를 맞춰 주세요.
        </Text>
      )}

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        disabled={isSubmitDisabled}
        onPress={onSubmit}
        style={[
          styles.primaryButton,
          isSubmitDisabled && styles.primaryButtonDisabled,
        ]}
      >
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          장바구니에 담기
        </Text>
      </PaymentAnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  messageText: {
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: AppColorStyles.yellow,
  },
  summaryCard: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    marginBottom: 18,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
    marginVertical: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  section: {
    marginBottom: 24,
  },
  readonlyField: {
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    justifyContent: 'center',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginRight: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantTag: {
    marginLeft: 6,
    ...PretendardTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.textHint,
    }),
  },
  amountInput: {
    flex: 1,
    minWidth: 92,
    paddingVertical: 6,
    paddingRight: 8,
  },
  amountInputWrapper: {
    width: 148,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  helperText: {
    textAlign: 'center',
    marginBottom: 18,
  },
  totalCard: {
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
