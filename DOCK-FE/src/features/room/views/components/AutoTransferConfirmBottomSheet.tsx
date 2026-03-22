import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { OutlineButton } from '@shared/components/buttons/OutlineButton';

interface AutoTransferConfirmBottomSheetProps {
  isVisible: boolean;
  isCurrentlyAgreed: boolean; // 현재 동의 상태인지 여부 (이 값에 따라 모달 내용이 다름)
  transferLimit: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const AutoTransferConfirmBottomSheet: React.FC<AutoTransferConfirmBottomSheetProps> = ({
  isVisible,
  isCurrentlyAgreed,
  transferLimit,
  onClose,
  onConfirm,
}) => {
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
            
            {isCurrentlyAgreed ? (
              // 동의 취소 모달 내용
              <>
                <Text style={styles.sheetTitle}>동의를 취소하겠습니까?</Text>
                <Text style={styles.sheetDescription}>
                  취소 후에는 정산금을 직접 송금해야 해요{'\n'}
                  언제든지 다시 동의할 수 있어요
                </Text>
              </>
            ) : (
              // 자동이체 동의 모달 내용
              <>
                <Text style={styles.sheetTitle}>자동이체에 동의할까요?</Text>
                <Text style={styles.sheetDescription}>
                  자동이체 한도는 프로필에서 수정 가능해요
                </Text>
                <View style={styles.limitBox}>
                  <Text style={styles.limitLabel}>설정된 자동이체 한도</Text>
                  <Text style={styles.limitValue}>{transferLimit.toLocaleString()}원</Text>
                </View>
              </>
            )}

            <View style={styles.buttonRow}>
              <OutlineButton
                text="아니요"
                onPress={onClose}
                isFullWidth={false}
                style={styles.buttonFlex}
              />
              <FilledButton
                text={isCurrentlyAgreed ? '취소하기' : '동의하기'}
                onPress={() => { onConfirm(); onClose(); }}
                isFullWidth={false}
                style={styles.buttonFlex}
              />
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
  },
  sheetDescription: {
    fontSize: 15,
    color: AppColorStyles.textHint,
    lineHeight: 22,
    marginBottom: 24,
  },
  limitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EFEFEF', // 연한 회색/노란색 테두리
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  limitLabel: {
    fontSize: 15,
    color: AppColorStyles.textPrimary,
  },
  limitValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColorStyles.black,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
});
