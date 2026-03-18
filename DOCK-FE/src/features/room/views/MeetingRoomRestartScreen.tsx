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

export function MeetingRoomRestartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RoomStackParamList, 'RoomRestart'>>();
  const route = useRoute<RouteProp<RoomStackParamList, 'RoomRestart'>>();
  const draft = getMeetingRoomRestartDraft(route.params.roomId);

  const [roomName, setRoomName] = useState(draft.roomName);
  const [detail, setDetail] = useState(draft.description);
  const [selectedTag, setSelectedTag] = useState<MeetingRoomTag>(draft.category);

  const handleRestartRoom = () => {
    if (!roomName.trim()) {
      Alert.alert('모임 다시 시작하기', '모임 이름을 입력해 주세요.');
      return;
    }

    Alert.alert('모임 다시 시작하기', 'mock 재시작 화면입니다.', [
      { text: '확인', onPress: () => navigation.goBack() },
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
        submitLabel="모임 다시 시작하기"
        onSubmit={handleRestartRoom}
      />
    </SafeAreaView>
  );
}
