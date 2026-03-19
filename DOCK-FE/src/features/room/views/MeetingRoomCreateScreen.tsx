import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { MeetingRoomEditor } from '../components/MeetingRoomEditor';
import { MeetingRoomLinkSheet } from '../components/MeetingRoomLinkSheet';
import {
  createMeetingRoomDraftMock,
  getMeetingRoomInviteLinkMock,
  type MeetingRoomTag,
} from '../models/roomMockData';

export function MeetingRoomCreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RoomStackParamList, 'RoomCreate'>>();
  const [roomName, setRoomName] = useState(createMeetingRoomDraftMock.roomName);
  const [detail, setDetail] = useState(createMeetingRoomDraftMock.description);
  const [selectedTag, setSelectedTag] = useState<MeetingRoomTag>(createMeetingRoomDraftMock.category);
  const [sheetVisible, setSheetVisible] = useState(false);

  const inviteLink = getMeetingRoomInviteLinkMock(201);

  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      Alert.alert('모임방 만들기', '모임 이름을 입력해 주세요.');
      return;
    }

    setSheetVisible(true);
  };

  const handleCopyLink = () => {
    Alert.alert('초대 링크', 'mock 링크가 준비되었습니다.');
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColorStyles.background }} edges={['top']}>
      <CustomAppBar
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />
      <MeetingRoomEditor
        roomName={roomName}
        detail={detail}
        selectedTag={selectedTag}
        onRoomNameChange={setRoomName}
        onDetailChange={setDetail}
        onTagChange={setSelectedTag}
        submitLabel="방 만들기"
        onSubmit={handleCreateRoom}
        showInviteGuide
      />
      <MeetingRoomLinkSheet
        visible={sheetVisible}
        inviteLink={inviteLink}
        onCopyLink={handleCopyLink}
        onLater={handleCloseSheet}
      />
    </SafeAreaView>
  );
}
