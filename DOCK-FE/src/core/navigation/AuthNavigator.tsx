import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '@features/auth/views/LoginScreen';
import KakaoLoginWebViewScreen from '@features/auth/views/KakaoLoginWebViewScreen';
import TermsScreen from '@features/auth/views/TermsScreen';
import ProfileSetupScreen from '@features/auth/views/ProfileSetupScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="KakaoLogin" component={KakaoLoginWebViewScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
