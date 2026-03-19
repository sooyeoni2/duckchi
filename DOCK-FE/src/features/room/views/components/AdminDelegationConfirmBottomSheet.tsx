import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';

interface AdminDelegationConfirmBottomSheetProps {
  isVisible: boolean;
  selectedName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const AdminDelegationConfirmBottomSheet: React.FC<AdminDelegationConfirmBottomSheetProps> = ({
  isVisible,
  selectedName,
  onClose,
  onConfirm,
}) => {
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
            
            <Text style={styles.sheetTitle}>{selectedName}에게 방장을 위임할까요?</Text>
            <Text style={styles.sheetDescription}>
              위임 후에는 취소할 수 없어요{'\n'}
              {selectedName}님이 모임 삭제 권한을 갖게 돼요
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={() => {
                  onConfirm();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>위임하기</Text>
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
    marginBottom: 8,
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
    borderColor: AppColorStyles.yellow,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.surface,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
  confirmButton: {
    flex: 1,
    height: 52,
    backgroundColor: AppColorStyles.yellow,
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
