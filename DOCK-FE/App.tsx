import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { RootStackParamList } from './src/core/navigation/types';
import { AuthScreen } from './src/features/auth/AuthScreen';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F5" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onStart={() => navigation.replace('Auth')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Auth">
            {({ navigation }) => (
              <AuthScreen onLogin={() => navigation.replace('App')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="App" component={AppNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
