import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { HomeScreen } from '../../features/home/HomeScreen';
import { ProfileScreen } from '../../features/profile/presentation/profile/ProfileScreen';
import { ReportScreen } from '../../features/report/ReportScreen';
import { RoomScreen } from '../../features/room/RoomScreen';
import { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const tabIcons: Record<keyof AppTabParamList, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Room: { active: 'account-group', inactive: 'account-group-outline' },
  Report: { active: 'chart-bar', inactive: 'chart-bar' },
  Profile: { active: 'account', inactive: 'account-outline' },
};

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          const icon = focused
            ? tabIcons[route.name].active
            : tabIcons[route.name].inactive;
          return <MaterialDesignIcons name={icon as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#CECECE',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#F2F3F5',
          borderTopColor: '#E0E0E0',
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Room" component={RoomScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
