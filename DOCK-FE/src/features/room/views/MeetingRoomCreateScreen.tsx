import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { MeetingRoomEditor } from '../components/MeetingRoomEditor';
import { createMeetingRoomDraftMock, type MeetingRoomTag } from '../models/roomMockData';
import { createMeetingRoom } from '../models/roomService';

export function MeetingRoomCreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RoomStackParamList, 'RoomCreate'>>();
  const [roomName, setRoomName] = useState(createMeetingRoomDraftMock.roomName);
  const [detail, setDetail] = useState(createMeetingRoomDraftMock.description);
  const [selectedTag, setSelectedTag] = useState<MeetingRoomTag>(createMeetingRoomDraftMock.category);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('모임방 만들기', '모임 이름을 입력해 주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      // 백엔드 명세가 data 랩핑되어 있을 수 있으므로 처리
      const response = await createMeetingRoom({
        roomName: roomName.trim(),
        category: selectedTag,
        description: detail.trim(),
      });
      
      const createdRoomId = response?.data?.roomId || response?.roomId;
      
      if (!createdRoomId) {
        throw new Error('응답에 roomId가 없습니다.');
      }

      // 모임방 생성 완료 시, 자동이체 가입 동의 화면으로 납치
      navigation.replace('AutoTransferJoin', {
        roomId: createdRoomId,
        roomName: roomName.trim(),
      });
      
    } catch (error: any) {
      Alert.alert('생성 실패', error?.response?.data?.message || '모임방 생성 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: AppColorStyles.background }} edges={['top'] as const}>
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
        onSubmit={isProcessing ? () => {} : handleCreateRoom}
        showInviteGuide
      />
    </SafeAreaView>
  );
}
