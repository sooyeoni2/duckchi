import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  cancelText?: string;
  confirmText?: string;
  confirmColor?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelText = '취소',
  confirmText = '확인',
  confirmColor = AppColorStyles.black,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity style={styles.dialog} activeOpacity={1}>
          <View style={styles.body}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          <View style={styles.dividerH} />
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={[styles.buttonText, { color: AppColorStyles.gray1 }]}>{cancelText}</Text>
            </TouchableOpacity>
            <View style={styles.dividerV} />
            <TouchableOpacity style={styles.button} onPress={onConfirm}>
              <Text style={[styles.buttonText, { color: confirmColor }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: 310,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 16, color: AppColorStyles.black }),
    textAlign: 'center',
  },
  message: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.gray1 }),
    textAlign: 'center',
    lineHeight: 20,
  },
  dividerH: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
  },
  buttons: {
    flexDirection: 'row',
    height: 44,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerV: {
    width: 1,
    backgroundColor: AppColorStyles.divider,
  },
  buttonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.black }),
  },
});
