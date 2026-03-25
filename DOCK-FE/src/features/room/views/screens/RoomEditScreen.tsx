import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { AppColorStyles } from '@core/theme/colors';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { MeetingRoomEditor } from '../../components/MeetingRoomEditor';
import { useRoomEditViewModel } from '../../viewmodels/useRoomEditViewModel';
import type { RoomStackParamList } from '@core/navigation/types';

type RoomEditScreenRouteProp = RouteProp<RoomStackParamList, 'RoomEdit'>;

const RoomEditScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RoomEditScreenRouteProp>();
  const roomId = route.params?.roomId || -1; // Fallback for mockup if not passed
  
  const { state, setName, setDetail, setCategory, saveRoomInfo } = useRoomEditViewModel(roomId);

  const handleSave = async () => {
    if (state.isSaving) return;
    const success = await saveRoomInfo();
    if (success) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom'] as const}>
      <CustomAppBar
        title="모임방 수정"
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <MeetingRoomEditor
        roomName={state.name}
        detail={state.detail}
        selectedTag={state.category}
        onRoomNameChange={setName}
        onDetailChange={setDetail}
        onTagChange={setCategory}
        submitLabel="수정하기"
        onSubmit={handleSave}
        showInviteGuide={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
});

export default RoomEditScreen;
