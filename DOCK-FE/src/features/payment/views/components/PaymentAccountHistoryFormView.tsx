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
import type { PaymentAccountHistoryDraftState } from '../../viewmodels/usePaymentAccountHistoryViewModel';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentAccountHistoryFormViewProps {
  draftState: PaymentAccountHistoryDraftState;
  selectedParticipantCount: number;
  onRetry: (historyId: string) => void;
  onItemNameChange: (title: string) => void;
  onToggleParticipant: (userId: number) => void;
  onNext: () => void;
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

/**
 * 계좌 내역에서 선택한 거래를 결제 등록 초안으로 바꾸는 폼.
 */
export function PaymentAccountHistoryFormView({
  draftState,
  selectedParticipantCount,
  onRetry,
  onItemNameChange,
  onToggleParticipant,
  onNext,
}: PaymentAccountHistoryFormViewProps) {
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
          선택한 거래 내역을 등록 폼으로 옮기는 중입니다.
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
          onPress={() => onRetry(draftState.historyId)}
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

  const { draft } = draftState;
  const isNextDisabled =
    draft.title.trim().length === 0 || selectedParticipantCount === 0;

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
            거래시간
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
            거래금액
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
          장바구니 항목명
        </Text>
        <TextInput
          value={draft.title}
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
    marginBottom: 20,
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
