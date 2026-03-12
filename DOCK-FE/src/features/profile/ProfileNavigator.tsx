import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import type { ProfileStackParamList } from '../../core/navigation/types';
import { BadgeListScreen } from './views/BadgeListScreen';
import { ProfileScreen } from './views/ProfileScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="BadgeList" component={BadgeListScreen} />
    </Stack.Navigator>
  );
}
