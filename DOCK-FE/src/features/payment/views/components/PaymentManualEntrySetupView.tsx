import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
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

interface PaymentManualEntrySetupViewProps {
  state: PaymentManualEntryState;
  selectedParticipantCount: number;
  onRetry: () => void;
  onItemNameChange: (itemName: string) => void;
  onTotalAmountChange: (text: string) => void;
  onToggleParticipant: (userId: number) => void;
  onNext: () => void;
}

const toAmountInputValue = (amount: number): string =>
  amount > 0 ? String(amount) : '';

/**
 * 직접 입력 1단계 화면.
 * 장바구니 항목명, 전체 금액, 참여자 on/off를 먼저 고정한다.
 */
export function PaymentManualEntrySetupView({
  state,
  selectedParticipantCount,
  onRetry,
  onItemNameChange,
  onTotalAmountChange,
  onToggleParticipant,
  onNext,
}: PaymentManualEntrySetupViewProps) {
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
          직접 입력 초안을 불러오는 중입니다.
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

  const { draft } = state;
  const isNextDisabled =
    draft.itemName.trim().length === 0 ||
    draft.totalAmount <= 0 ||
    selectedParticipantCount === 0;

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
        <TextInput
          value={draft.itemName}
          onChangeText={onItemNameChange}
          placeholder="항목명을 입력해 주세요"
          placeholderTextColor={AppColorStyles.textHint}
          style={[
            KBODiaGothicTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.black,
            }),
            styles.nameInput,
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
          >
            금액 (수정 가능)
          </Text>
        <View style={styles.amountInputWrapper}>
          <TextInput
            value={toAmountInputValue(draft.totalAmount)}
            onChangeText={onTotalAmountChange}
            placeholder="금액을 입력해 주세요"
            placeholderTextColor={AppColorStyles.textHint}
            keyboardType="number-pad"
            textAlign="right"
            maxLength={10}
            style={[
              KBODiaGothicTextStyle.bold({
                fontSize: 20,
                color: AppColorStyles.gray1,
              }),
              styles.amountInput,
            ]}
          />
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.textSecondary,
            })}
          >
            원
          </Text>
        </View>
        <Text
          style={[
            PretendardTextStyle.medium({
              fontSize: 13,
              color: AppColorStyles.textSecondary,
            }),
            styles.amountHelperText,
          ]}
        >
          숫자만 입력할 수 있어요
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            참여자 설정
          </Text>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 13,
              color: AppColorStyles.textSecondary,
            })}
          >
            {`${selectedParticipantCount}명 선택됨`}
          </Text>
        </View>

        {draft.participants.map((participant) => (
          <View key={participant.userId} style={styles.participantRow}>
            <View style={styles.participantInfo}>
              <View
                style={[
                  styles.avatarCircle,
                  !participant.isSelected && styles.avatarCircleInactive,
                ]}
              >
                <MaterialDesignIcons
                  name="account-outline"
                  size={28}
                  color={
                    participant.isSelected
                      ? AppColorStyles.gray2
                      : AppColorStyles.gray3
                  }
                />
              </View>

              <View>
                <Text
                  style={KBODiaGothicTextStyle.medium({
                    fontSize: 18,
                    color: participant.isSelected
                      ? AppColorStyles.black
                      : AppColorStyles.textSecondary,
                  })}
                >
                  {participant.userName}
                </Text>
                {!participant.isSelected && (
                  <Text
                    style={PretendardTextStyle.medium({
                      fontSize: 12,
                      color: AppColorStyles.textHint,
                    })}
                  >
                    불참
                  </Text>
                )}
              </View>
            </View>

            <Switch
              value={participant.isSelected}
              onValueChange={() => onToggleParticipant(participant.userId)}
              trackColor={{
                false: AppColorStyles.gray3,
                true: AppColorStyles.gray1,
              }}
              thumbColor={AppColorStyles.white}
              ios_backgroundColor={AppColorStyles.gray3}
            />
          </View>
        ))}
      </View>

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        disabled={isNextDisabled}
        onPress={onNext}
        style={[
          styles.primaryButton,
          isNextDisabled && styles.primaryButtonDisabled,
        ]}
      >
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          다음
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
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nameInput: {
    height: 56,
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  amountInput: {
    flex: 1,
    height: 56,
    paddingRight: 10,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  amountHelperText: {
    marginTop: 8,
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
  avatarCircleInactive: {
    opacity: 0.55,
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
