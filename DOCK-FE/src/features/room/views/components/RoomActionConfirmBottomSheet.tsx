import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { OutlineButton } from '@shared/components/buttons/OutlineButton';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

export type RoomActionType = 'DELETE' | 'LEAVE' | 'START' | 'END';

export interface PendingSettlement {
  count: number;
  name: string;
  amount: number;
  requester: string;
}

interface RoomActionConfirmBottomSheetProps {
  isVisible: boolean;
  type: RoomActionType;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pendingSettlement?: PendingSettlement;
}

const ACTION_STRINGS: Record<RoomActionType, { title: string; desc: string; confirm: string; statusMessage?: string }> = {
  DELETE: {
    title: '모임방을 삭제할까요?',
    desc: '삭제된 모임방은 복구할 수 없어요\n정산 내역이 모두 사라져요',
    confirm: '삭제하기',
  },
  LEAVE: {
    title: '모임방을 나가시겠어요?',
    desc: '나가면 정산 내역을 더 이상 볼 수 없어요.',
    confirm: '나가기',
    statusMessage: '모든 정산이 완료됐어요!',
  },
  START: {
    title: '모임을 시작할까요?',
    desc: '모임을 시작하면 결제 내역을\n추가하고 정산을 진행할 수 있어요',
    confirm: '시작하기',
  },
  END: {
    title: '모임을 종료할까요?',
    desc: '모임이 종료되면 더 이상\n결제 내역을 추가할 수 없어요',
    confirm: '종료하기',
  },
};

const toWon = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export const RoomActionConfirmBottomSheet: React.FC<RoomActionConfirmBottomSheetProps> = ({
  isVisible,
  type,
  isProcessing = false,
  onClose,
  onConfirm,
  pendingSettlement,
}) => {
  const content = ACTION_STRINGS[type];
  const hasPending = type === 'LEAVE' && pendingSettlement != null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            {hasPending ? (
              <>
                <Text style={styles.sheetTitle}>아직 나갈 수 없어요</Text>
                <Text style={styles.sheetDescription}>
                  {'미완료 정산이 있어요.\n정산을 먼저 완료해야 나갈 수 있어요.'}
                </Text>

                <View style={styles.pendingBox}>
                  <Text style={styles.pendingLabel}>
                    미완료 정산 ({pendingSettlement!.count}건)
                  </Text>
                  <View style={styles.pendingRow}>
                    <Text style={styles.pendingName}>{pendingSettlement!.name}</Text>
                    <Text style={styles.pendingAmount}>{toWon(pendingSettlement!.amount)}</Text>
                  </View>
                  <Text style={styles.pendingRequester}>{pendingSettlement!.requester} 요청</Text>
                </View>

                <FilledButton
                  text="지금 바로 정산하기"
                  onPress={onConfirm}
                  isLoading={isProcessing}
                  height={54}
                  borderRadius={14}
                  textStyle={KBODiaGothicTextStyle.bold({ fontSize: 17, color: AppColorStyles.black })}
                />
                <Text style={styles.pendingHint}>정산 완료 후 나가기가 활성화돼요</Text>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>{content.title}</Text>
                <Text style={styles.sheetDescription}>{content.desc}</Text>

                {content.statusMessage != null && (
                  <View style={styles.statusBox}>
                    <Text style={styles.statusText}>{content.statusMessage}</Text>
                  </View>
                )}

                <View style={styles.buttonRow}>
                  <OutlineButton
                    text="취소"
                    onPress={onClose}
                    isFullWidth={false}
                    width={150}
                    height={44}
                    borderRadius={10}
                    textStyle={KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.black })}
                  />
                  <FilledButton
                    text={content.confirm}
                    onPress={onConfirm}
                    isLoading={isProcessing}
                    isFullWidth={false}
                    width={150}
                    height={44}
                    borderRadius={10}
                    textStyle={KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.black })}
                  />
                </View>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: AppColorStyles.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 80,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: AppColorStyles.black,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColorStyles.textPrimary,
    marginBottom: 8,
    textAlign: 'left',
  },
  sheetDescription: {
    fontSize: 15,
    color: AppColorStyles.textHint,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'left',
  },
  // 미완료 정산 박스
  pendingBox: {
    borderWidth: 1.5,
    borderColor: AppColorStyles.gray3,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 6,
  },
  pendingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColorStyles.textPrimary,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColorStyles.textPrimary,
  },
  pendingRequester: {
    fontSize: 13,
    color: AppColorStyles.textHint,
  },
  pendingHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    color: AppColorStyles.textHint,
  },
  // 완료 상태 박스
  statusBox: {
    borderWidth: 1.5,
    borderColor: AppColorStyles.gray3,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColorStyles.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
  },
});
