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
import { Feather } from '@expo/vector-icons';

interface InviteLinkBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  inviteLink: string;
}

export const InviteLinkBottomSheet: React.FC<InviteLinkBottomSheetProps> = ({
  isVisible,
  onClose,
  inviteLink,
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
            
            <Text style={styles.sheetTitle}>친구를 모임방으로 초대하기</Text>
            <Text style={styles.sheetDescription}>
              링크를 공유하면 참여자가{'\n'}바로 모임에 입장해요
            </Text>
            
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {inviteLink}
              </Text>
              <TouchableOpacity style={styles.copyButton} activeOpacity={0.6}>
                <Feather name="link" size={20} color={AppColorStyles.textPrimary} />
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
  },
  sheetDescription: {
    fontSize: 15,
    color: AppColorStyles.textHint,
    lineHeight: 22,
    marginBottom: 24,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    borderRadius: 12,
    paddingLeft: 16,
    height: 56,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    color: AppColorStyles.textPrimary,
  },
  copyButton: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
