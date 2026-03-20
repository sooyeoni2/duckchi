import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
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
import type { PaymentManualEntryState } from '../../viewmodels/usePaymentManualEntryViewModel';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentManualEntrySplitViewProps {
  state: PaymentManualEntryState;
  splitAmountTotal: number;
  onRetry: () => void;
  onParticipantAmountChange: (userId: number, text: string) => void;
  onSubmit: () => void;
}

const formatAmount = (amount: number): string =>
  `${amount.toLocaleString('ko-KR')}원`;

const toAmountInputValue = (amount: number): string =>
  amount > 0 ? String(amount) : '';

/**
 * 직접 입력 2단계 화면.
 * 선택된 참여자만 노출하고 각자 부담 금액을 조정할 수 있게 한다.
 */
export function PaymentManualEntrySplitView({
  state,
  splitAmountTotal,
  onRetry,
  onParticipantAmountChange,
  onSubmit,
}: PaymentManualEntrySplitViewProps) {
  if (state.status === 'idle' || state.status === 'loading') {
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
          금액 분배 화면을 준비하는 중입니다.
        </Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centerCard}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 14,
            lineHeight: 20,
            color: AppColorStyles.textSecondary,
          })}
        >
          {state.message}
        </Text>
        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onRetry}
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

  const selectedParticipants = state.draft.participants.filter(
    (participant) => participant.isSelected,
  );
  const isSubmitDisabled =
    selectedParticipants.length === 0 ||
    splitAmountTotal !== state.draft.totalAmount;

  return (
    <View>
      <View style={styles.section}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          장바구니 항목명
        </Text>
        <View style={styles.readonlyField}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            {state.draft.itemName}
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
            {formatAmount(state.draft.totalAmount)}
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

        {selectedParticipants.map((participant) => (
          <View key={participant.userId} style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <View style={styles.avatarCircle}>
                <MaterialDesignIcons
                  name="account-outline"
                  size={28}
                  color={AppColorStyles.gray2}
                />
              </View>

              <Text
                style={KBODiaGothicTextStyle.medium({
                  fontSize: 18,
                  color: AppColorStyles.black,
                })}
              >
                {participant.userName}
              </Text>
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
              splitAmountTotal === state.draft.totalAmount
                ? AppColorStyles.black
                : AppColorStyles.danger,
          })}
        >
          {formatAmount(splitAmountTotal)}
        </Text>
      </View>

      {splitAmountTotal !== state.draft.totalAmount && (
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
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginRight: 14,
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
