import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import type { ProfileStackParamList } from '../../core/navigation/types';
import { BadgeListScreen } from './views/BadgeListScreen';
import { ProfileScreen } from './views/ProfileScreen';
import { BankAccountRegisterScreen } from '../bank/views/BankAccountRegisterScreen';
import { SettingsScreen } from './views/SettingsScreen';
import { TransferLimitScreen } from './views/TransferLimitScreen';
import { TermsViewScreen } from '../auth/views/terms/TermsViewScreen';
import { PrivacyViewScreen } from '../auth/views/terms/PrivacyViewScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="BadgeList" component={BadgeListScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="BankAccountRegister" component={BankAccountRegisterScreen} />
      <Stack.Screen name="TransferLimit" component={TransferLimitScreen} />
      <Stack.Screen name="TermsView" component={TermsViewScreen} />
      <Stack.Screen name="PrivacyView" component={PrivacyViewScreen} />
    </Stack.Navigator>
  );
}
