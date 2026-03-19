import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';

export type RoomActionType = 'DELETE' | 'LEAVE' | 'START' | 'END';

interface RoomActionConfirmBottomSheetProps {
  isVisible: boolean;
  type: RoomActionType;
  isProcessing?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ACTION_STRINGS: Record<RoomActionType, { title: string, desc: string, confirm: string, color: string }> = {
  DELETE: {
    title: '모임방을 삭제할까요?',
    desc: '삭제된 모임방은 복구할 수 없어요\n정산 내역이 모두 사라져요',
    confirm: '삭제하기',
    color: AppColorStyles.yellow,
  },
  LEAVE: {
    title: '모임방을 나가시겠어요?',
    desc: '나가면 정산 내역을 더 이상 볼 수 없어요.',
    confirm: '나가기',
    color: AppColorStyles.yellow,
  },
  START: {
    title: '모임을 시작할까요?',
    desc: '모임을 시작하면 결제 내역을\n추가하고 정산을 진행할 수 있어요',
    confirm: '시작하기',
    color: AppColorStyles.yellow,
  },
  END: {
    title: '모임을 종료할까요?',
    desc: '모임이 종료되면 더 이상\n결제 내역을 추가할 수 없어요',
    confirm: '종료하기',
    color: AppColorStyles.yellow,
  },
};

export const RoomActionConfirmBottomSheet: React.FC<RoomActionConfirmBottomSheetProps> = ({
  isVisible,
  type,
  isProcessing = false,
  onClose,
  onConfirm,
}) => {
  const content = ACTION_STRINGS[type];

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
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
            
            <Text style={styles.sheetTitle}>{content.title}</Text>
            <Text style={styles.sheetDescription}>{content.desc}</Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onClose}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: content.color }]} 
                onPress={onConfirm}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={AppColorStyles.black} />
                ) : (
                  <Text style={styles.confirmButtonText}>{content.confirm}</Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  sheetDescription: {
    fontSize: 15,
    color: AppColorStyles.textHint,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColorStyles.textPrimary,
  },
  confirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
});
