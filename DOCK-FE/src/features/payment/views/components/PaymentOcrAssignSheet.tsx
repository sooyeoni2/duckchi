import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type {
  OcrAssignMode,
  OcrItemQuantityAllocation,
  OcrParticipantDraft,
} from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentOcrAssignSheetProps {
  visible: boolean;
  itemName: string;
  itemQuantity: number;
  participants: OcrParticipantDraft[];
  mode: OcrAssignMode;
  selectedUserIds: number[];
  quantityAllocations: OcrItemQuantityAllocation[];
  onSelectMode: (mode: OcrAssignMode) => void;
  onToggleParticipant: (userId: number) => void;
  onUpdateQuantity: (userId: number, delta: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function AssignModeButton({
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

export function PaymentOcrAssignSheet({
  visible,
  itemName,
  itemQuantity,
  participants,
  mode,
  selectedUserIds,
  quantityAllocations,
  onSelectMode,
  onToggleParticipant,
  onUpdateQuantity,
  onClose,
  onConfirm,
}: PaymentOcrAssignSheetProps) {
  const assignedQuantity = quantityAllocations.reduce(
    (sum, allocation) => sum + allocation.quantity,
    0,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.overlay} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.dragHandle} />

          <Text style={styles.itemTitle}>{itemName}</Text>

          <View style={styles.modeRow}>
            <View style={[styles.modeButtonWrap, styles.modeButtonSpacing]}>
              <AssignModeButton
                label="인원별 N빵"
                active={mode === 'PERSON'}
                onPress={() => onSelectMode('PERSON')}
              />
            </View>
            <View style={styles.modeButtonWrap}>
              <AssignModeButton
                label="수량별 나누기"
                active={mode === 'QUANTITY'}
                onPress={() => onSelectMode('QUANTITY')}
              />
            </View>
          </View>

          {participants.map((participant) => {
            const quantity =
              quantityAllocations.find(
                (allocation) => allocation.userId === participant.userId,
              )?.quantity ?? 0;

            return (
              <View key={participant.userId} style={styles.participantRow}>
                <View style={styles.participantInfo}>
                  <View style={styles.avatarCircle}>
                    <MaterialDesignIcons
                      name="account-outline"
                      size={28}
                      color={AppColorStyles.gray2}
                    />
                  </View>
                  <Text style={styles.participantName}>{participant.userName}</Text>
                </View>

                {mode === 'PERSON' ? (
                  <Switch
                    value={selectedUserIds.includes(participant.userId)}
                    onValueChange={() => onToggleParticipant(participant.userId)}
                    trackColor={{
                      false: AppColorStyles.gray3,
                      true: AppColorStyles.gray1,
                    }}
                    thumbColor={AppColorStyles.white}
                    ios_backgroundColor={AppColorStyles.gray3}
                  />
                ) : (
                  <View style={styles.quantityStepper}>
                    <PaymentAnimatedTouchable
                      activeOpacity={0.85}
                      onPress={() => onUpdateQuantity(participant.userId, -1)}
                      style={styles.stepperButton}
                    >
                      <MaterialDesignIcons
                        name="minus-circle-outline"
                        size={22}
                        color={
                          quantity > 0
                            ? AppColorStyles.black
                            : AppColorStyles.gray3
                        }
                      />
                    </PaymentAnimatedTouchable>

                    <Text style={styles.quantityText}>{quantity}</Text>

                    <PaymentAnimatedTouchable
                      activeOpacity={0.85}
                      onPress={() => onUpdateQuantity(participant.userId, 1)}
                      style={styles.stepperButton}
                    >
                      <MaterialDesignIcons
                        name="plus-circle-outline"
                        size={22}
                        color={AppColorStyles.black}
                      />
                    </PaymentAnimatedTouchable>
                  </View>
                )}
              </View>
            );
          })}

          {mode === 'QUANTITY' && (
            <Text style={styles.helperText}>
              {`수량 합계 ${assignedQuantity}/${itemQuantity}`}
            </Text>
          )}

          <PaymentAnimatedTouchable
            activeOpacity={0.85}
            onPress={onConfirm}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>확인</Text>
          </PaymentAnimatedTouchable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  overlay: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: AppColorStyles.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  dragHandle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: AppColorStyles.black,
    alignSelf: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  itemTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22,
      color: AppColorStyles.black,
    }),
    marginBottom: 18,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  modeButtonWrap: {
    flex: 1,
  },
  modeButtonSpacing: {
    marginRight: 12,
  },
  modeButton: {
    height: 68,
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
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  participantName: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.gray1,
    }),
    width: 32,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  helperText: {
    ...PretendardTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.textSecondary,
    }),
    marginTop: 6,
    marginBottom: 18,
  },
  confirmButton: {
    height: 60,
    borderRadius: 14,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
  },
});
