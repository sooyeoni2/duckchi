import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import { MeetingCard } from '../components/MeetingCard';
import { meetingRoomMockData, type MeetingRoom } from '../models/roomMockData';

type Nav = NativeStackNavigationProp<RoomStackParamList, 'RoomList'>;

export function RoomListScreen() {
  const navigation = useNavigation<Nav>();

  const handleCardPress = (meeting: MeetingRoom) => {
    navigation.navigate('RoomDetail', { roomId: meeting.roomId });
  };

  const handleActionPress = (meeting: MeetingRoom) => {
    if (meeting.status === 'ENDED') {
      navigation.navigate('RoomRestart', { roomId: meeting.roomId });
      return;
    }
    navigation.navigate('RoomDetail', { roomId: meeting.roomId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        title="모임방"
        centerTitle={false}
        showBackButton={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        actions={[
          <TouchableOpacity
            key="create-room"
            style={styles.createButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RoomCreate')}
          >
            <Text style={styles.createButtonText}>+ 새 모임</Text>
          </TouchableOpacity>,
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {meetingRoomMockData.map((meeting) => (
          <MeetingCard
            key={meeting.roomId}
            meeting={meeting}
            onPress={handleCardPress}
            onActionPress={handleActionPress}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 14,
  },
  createButton: {
    height: 24,
    borderRadius: 6,
    paddingHorizontal: 16,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.black, letterSpacing: 0.5 }),
  },
});
