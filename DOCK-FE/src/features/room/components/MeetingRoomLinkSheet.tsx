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
import type { MeetingRoomInviteLink } from '../models/roomMockData';

interface MeetingRoomLinkSheetProps {
  visible: boolean;
  inviteLink: MeetingRoomInviteLink;
  onCopyLink: () => void;
  onLater: () => void;
}

export function MeetingRoomLinkSheet({
  visible,
  inviteLink,
  onCopyLink,
  onLater,
}: MeetingRoomLinkSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onLater} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>모임방이 만들어졌어요!</Text>
          <Text style={styles.description}>링크를 공유하면 참여자가{'\n'}바로 모임에 입장해요</Text>

          <TouchableOpacity activeOpacity={0.85} style={styles.linkBox} onPress={onCopyLink}>
            <Text style={styles.linkText} numberOfLines={1}>
              {inviteLink.inviteLink}
            </Text>
            <MaterialCommunityIcons name="link-variant" size={28} color={AppColorStyles.black} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={onLater} style={styles.laterButton}>
            <Text style={styles.laterText}>나중에 하기</Text>
          </TouchableOpacity>
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
    paddingBottom: 24,
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
    ...KBODiaGothicTextStyle.bold({
      fontSize: 26,
      color: AppColorStyles.black,
      lineHeight: 32,
    }),
    marginBottom: 10,
  },
  description: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.gray1,
      lineHeight: 28,
    }),
    marginBottom: 28,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    borderRadius: 12,
    backgroundColor: AppColorStyles.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkText: {
    flex: 1,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray1,
      lineHeight: 22,
    }),
  },
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
  },
});
