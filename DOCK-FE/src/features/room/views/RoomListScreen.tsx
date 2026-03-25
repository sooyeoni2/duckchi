import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RoomStackParamList } from '@core/navigation/types';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import { MeetingCard } from '../components/MeetingCard';
import type { MeetingRoom } from '../models/roomMockData';
import { useRoomStore } from '../models/roomStore';

type Nav = NativeStackNavigationProp<RoomStackParamList, 'RoomList'>;

export function RoomListScreen() {
  const navigation = useNavigation<Nav>();
  const rooms = useRoomStore((s) => s.rooms);
  const fetchRooms = useRoomStore((s) => s.fetchRooms);

  useFocusEffect(
    React.useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );
  const createScale = React.useRef(new Animated.Value(1)).current;

  const handleCreatePressIn = () => {
    Animated.spring(createScale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handleCreatePressOut = () => {
    Animated.spring(createScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

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

  // 카테고리별 그룹핑 (순서 유지)
  const categoryGroups = rooms.reduce<{ category: string; rooms: MeetingRoom[] }[]>((acc, room) => {
    const existing = acc.find((g) => g.category === room.category);
    if (existing) {
      existing.rooms.push(room);
    } else {
      acc.push({ category: room.category, rooms: [room] });
    }
    return acc;
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAppBar
        title="모임방"
        centerTitle={false}
        showBackButton={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        actions={[
          <Animated.View key="create-room" style={{ transform: [{ scale: createScale }] }}>
            <Pressable
              style={styles.createButton}
              onPress={() => navigation.navigate('RoomCreate')}
              onPressIn={handleCreatePressIn}
              onPressOut={handleCreatePressOut}
            >
              <Text style={styles.createButtonText}>+ 새 모임</Text>
            </Pressable>
          </Animated.View>,
        ]}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {categoryGroups.map((group) => (
          <MeetingCard
            key={group.category}
            category={group.category}
            rooms={group.rooms}
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
