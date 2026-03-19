import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import type { RoomStackParamList } from '../../core/navigation/types';
import { RoomScreen } from './views/RoomScreen';
import { MeetingRoomCreateScreen } from './views/MeetingRoomCreateScreen';
import { MeetingRoomRestartScreen } from './views/MeetingRoomRestartScreen';
import { RoomListScreen } from './views/RoomListScreen';
import RoomMoreOptionsScreen from './views/screens/RoomMoreOptionsScreen';
import AutoTransferAgreeScreen from './views/screens/AutoTransferAgreeScreen';
import AdminDelegationScreen from './views/screens/AdminDelegationScreen';
import RoomEditScreen from './views/screens/RoomEditScreen';

const Stack = createNativeStackNavigator<RoomStackParamList>();

export function RoomNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="RoomList" component={RoomListScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="RoomDetail" component={RoomScreen} />
      <Stack.Screen name="RoomCreate" component={MeetingRoomCreateScreen} />
      <Stack.Screen name="RoomRestart" component={MeetingRoomRestartScreen} />
      <Stack.Screen name="RoomMoreOptions" component={RoomMoreOptionsScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AutoTransferAgree" component={AutoTransferAgreeScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="AdminDelegation" component={AdminDelegationScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="RoomEdit" component={RoomEditScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}
