import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { OcrReceiptDraft, OcrSplitMode } from '../../../models/types/paymentTypes';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

interface PaymentOcrSplitSetupViewProps {
  draft: OcrReceiptDraft;
  itemSplitEnabled?: boolean;
  selectedParticipantCount: number;
  perPersonAmount: number;
  onSelectSplitMode: (mode: OcrSplitMode) => void;
  onToggleParticipant: (userId: number) => void;
  onPrimaryAction: () => void;
}

const formatAmount = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

function SplitModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PaymentAnimatedTouchable
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.modeButton,
        active ? styles.modeButtonActive : styles.modeButtonInactive,
      ]}
    >
      <Text
        style={KBODiaGothicTextStyle.bold({
          fontSize: 18,
          color: active ? AppColorStyles.white : AppColorStyles.black,
        })}
      >
        {label}
      </Text>
    </PaymentAnimatedTouchable>
  );
}

export function PaymentOcrSplitSetupView({
  draft,
  itemSplitEnabled = true,
  selectedParticipantCount,
  perPersonAmount,
  onSelectSplitMode,
  onToggleParticipant,
  onPrimaryAction,
}: PaymentOcrSplitSetupViewProps) {
  const isPrimaryDisabled = selectedParticipantCount === 0;

  return (
    <View>
      <View style={styles.modeRow}>
        <View style={[styles.modeButtonWrap, styles.modeButtonSpacing]}>
          <SplitModeButton
            label="전체 N빵"
            active={draft.splitMode === 'TOTAL'}
            onPress={() => onSelectSplitMode('TOTAL')}
          />
        </View>
        <View style={styles.modeButtonWrap}>
          <PaymentAnimatedTouchable
            activeOpacity={itemSplitEnabled ? 0.85 : 1}
            disabled={!itemSplitEnabled}
            onPress={() => onSelectSplitMode('ITEM')}
            style={[
              styles.modeButton,
              draft.splitMode === 'ITEM'
                ? styles.modeButtonActive
                : styles.modeButtonInactive,
              !itemSplitEnabled && styles.modeButtonDisabled,
            ]}
          >
            <Text
              style={KBODiaGothicTextStyle.bold({
                fontSize: 18,
                color:
                  draft.splitMode === 'ITEM'
                    ? AppColorStyles.white
                    : itemSplitEnabled
                      ? AppColorStyles.black
                      : AppColorStyles.textHint,
              })}
            >
              메뉴별 나누기
            </Text>
          </PaymentAnimatedTouchable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>총 금액</Text>
        <Text style={styles.summaryAmount}>{formatAmount(draft.totalAmount)}</Text>
        <Text style={styles.summaryMeta}>
          {`${draft.storeName} · ${draft.items.length}건`}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>참여자 설정</Text>
      </View>

      {draft.participants.map((participant: any) => (
        <View key={participant.userId} style={styles.participantRow}>
          <View style={styles.participantInfo}>
            {participant.profileImageUrl ? (
              <Image
                source={{ uri: participant.profileImageUrl }}
                style={styles.avatarImage}
              />
            ) : (
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
            )}

            <View style={styles.participantNameRow}>
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
              {participant.userTag && (
                <Text style={styles.participantTag}>#{participant.userTag}</Text>
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

      {draft.splitMode === 'TOTAL' && (
        <View style={styles.perPersonCard}>
          <Text style={styles.perPersonLabel}>1인 정산금액</Text>
          <Text style={styles.perPersonAmount}>{formatAmount(perPersonAmount)}</Text>
        </View>
      )}

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        disabled={isPrimaryDisabled}
        onPress={onPrimaryAction}
        style={[
          styles.primaryButton,
          isPrimaryDisabled && styles.primaryButtonDisabled,
        ]}
      >
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          {draft.splitMode === 'TOTAL' ? '장바구니 담기' : '다음'}
        </Text>
      </PaymentAnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modeButtonWrap: {
    flex: 1,
  },
  modeButtonSpacing: {
    marginRight: 12,
  },
  modeButton: {
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: AppColorStyles.gray1,
  },
  modeButtonInactive: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
  },
  modeButtonDisabled: {
    borderColor: AppColorStyles.gray3,
    backgroundColor: AppColorStyles.gray5,
  },
  summaryCard: {
    padding: 18,
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
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
  },
  avatarCircleInactive: {
    opacity: 0.6,
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
  perPersonCard: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  perPersonLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textHint,
    }),
  },
  perPersonAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.gray1,
    }),
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
    marginTop: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
