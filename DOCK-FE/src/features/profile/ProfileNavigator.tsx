import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import type { ProfileStackParamList } from '../../core/navigation/types';
import { BadgeListScreen } from './views/BadgeListScreen';
import { ProfileScreen } from './views/ProfileScreen';
import { BankAccountRegisterScreen } from './views/BankAccountRegisterScreen';
import { SettingsScreen } from './views/SettingsScreen';
import { TransferLimitScreen } from './views/TransferLimitScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="BadgeList" component={BadgeListScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'none' }} />
      <Stack.Screen name="BankAccountRegister" component={BankAccountRegisterScreen} />
      <Stack.Screen name="TransferLimit" component={TransferLimitScreen} />
    </Stack.Navigator>
  );
}
