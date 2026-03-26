import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { MeetingRoomEditor } from '../components/MeetingRoomEditor';
import { getMeetingRoomRestartDraft, type MeetingRoomTag } from '../models/roomMockData';
import { useRoomActionViewModel } from '../viewmodels/useRoomActionViewModel';
import { useRoomStore } from '../models/roomStore';

export function MeetingRoomRestartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RoomStackParamList, 'RoomRestart'>>();
  const route = useRoute<RouteProp<RoomStackParamList, 'RoomRestart'>>();
  const roomId = route.params.roomId;
  
  const rooms = useRoomStore((state) => state.rooms);
  const currentRoom = rooms.find((r) => r.roomId === roomId);
  
  const draft = getMeetingRoomRestartDraft(roomId);

  const [roomName, setRoomName] = useState(currentRoom?.roomName || draft.roomName);
  const [detail, setDetail] = useState(currentRoom?.description || draft.description);
  const [selectedTag, setSelectedTag] = useState<MeetingRoomTag>(
    (currentRoom?.category as MeetingRoomTag) || draft.category
  );

  const { startRoom } = useRoomActionViewModel(roomId);

  const handleRestartRoom = () => {
    if (!roomName.trim()) {
      Alert.alert('시작하기', '모임 이름을 입력해 주세요.');
      return;
    }

    Alert.alert('시작하기', '모임을 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: async () => {
          const success = await startRoom({
            category: selectedTag,
            description: detail,
          });
          if (success) {
            navigation.goBack();
          }
        },
      },
    ]);
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
        submitLabel="시작하기"
        onSubmit={handleRestartRoom}
        roomNameEnabled={false}
      />
    </SafeAreaView>
  );
}
