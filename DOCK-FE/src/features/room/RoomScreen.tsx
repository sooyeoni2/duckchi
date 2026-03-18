import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { RoomStackParamList } from '../../core/navigation/types';
import { CustomAppBar } from '../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../shared/components/buttons/FilledButton';
import { MeetingCard } from './components/MeetingCard';
import { meetingRoomMockData, type MeetingRoom } from './models/roomMockData';

export function RoomScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RoomStackParamList, 'RoomList'>>();
  const rooms = meetingRoomMockData.filter((meeting): meeting is MeetingRoom => meeting != null);

  const handleCreateMeetingPress = () => {
    navigation.navigate('RoomCreate');
  };

  const handleRoomActionPress = (meeting: MeetingRoom) => {
    if (meeting.status === 'ENDED') {
      navigation.navigate('RoomRestart', { roomId: meeting.roomId });
      return;
    }

    Alert.alert('모임 종료', '종료 기능은 API 연결 후 동작합니다.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="모임방"
        centerTitle={false}
        showBackButton={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        actions={[
          <FilledButton
            key="create-room"
            text="+ 새 모임"
            onPress={handleCreateMeetingPress}
            isFullWidth={false}
            width={67}
            height={24}
            borderRadius={6}
            style={styles.createButton}
            textStyle={styles.createButtonText}
          />,
        ]}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.cardList}>
          {rooms.map((meeting) => (
            <MeetingCard
              key={meeting.roomId}
              meeting={meeting}
              onActionPress={handleRoomActionPress}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  content: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  createButton: {
    paddingHorizontal: 0,
  },
  createButtonText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 13,
      color: AppColorStyles.black,
      lineHeight: 16,
      letterSpacing: 0.5,
    }),
  },
  cardList: {
    paddingHorizontal: 21,
    gap: 22,
  },
});
