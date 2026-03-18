import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { AppColorStyles } from '../theme/colors';
import { HomeScreen } from '../../features/home/HomeScreen';
import { ProfileNavigator } from '../../features/profile/ProfileNavigator';
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
        tabBarActiveTintColor: AppColorStyles.black,
        tabBarInactiveTintColor: AppColorStyles.gray2,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: AppColorStyles.background,
          borderTopColor: AppColorStyles.gray3,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('Home'),
        })}
      />
      <Tab.Screen
        name="Room"
        component={RoomScreen}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('Room'),
        })}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('Report'),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => navigation.navigate('Profile', { screen: 'ProfileMain' }),
        })}
      />
    </Tab.Navigator>
  );
}
