import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
interface MeetingRoomLinkSheetProps {
  visible: boolean;
  inviteLink: string;
  onCopyLink: () => void;
  onLater: () => void;
  title?: string;
  showLater?: boolean;
}

export function MeetingRoomLinkSheet({
  visible,
  inviteLink,
  onCopyLink,
  onLater,
  title = '모임방이 만들어졌어요!',
  showLater = true,
}: MeetingRoomLinkSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onLater} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>링크를 공유하면 참여자가{'\n'}바로 모임에 입장해요</Text>
 
          <TouchableOpacity activeOpacity={0.85} style={styles.linkBox} onPress={onCopyLink}>
            <Text style={styles.linkText} numberOfLines={1}>
              {inviteLink}
            </Text>
            <MaterialCommunityIcons name="link-variant" size={28} color={AppColorStyles.black} />
          </TouchableOpacity>

          {showLater && (
            <TouchableOpacity activeOpacity={0.8} onPress={onLater} style={styles.laterButton}>
              <Text style={styles.laterText}>나중에 하기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sheet: {
    backgroundColor: AppColorStyles.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 28,
    paddingBottom: 60,
  },
  handle: {
    alignSelf: 'center',
    width: 54,
    height: 4,
    borderRadius: 999,
    backgroundColor: AppColorStyles.black,
    marginBottom: 42,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 22,
      color: AppColorStyles.black,
      lineHeight: 32,
    }),
    marginBottom: 10,
  } as any,
  description: {
    ...KBODiaGothicTextStyle.light({
      fontSize: 15,
      color: '#C2C2C2',
      lineHeight: 22,
    }),
    marginBottom: 28,
  } as any,
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: AppColorStyles.yellow,
    borderRadius: 12,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  linkText: {
    flex: 1,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray1,
      lineHeight: 22,
    }),
  } as any,
  laterButton: {
    alignSelf: 'center',
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  laterText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray2,
      lineHeight: 22,
    }),
  } as any,
});
