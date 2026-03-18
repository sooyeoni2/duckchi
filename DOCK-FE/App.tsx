import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AuthNavigator } from './src/core/navigation/AuthNavigator';
import { RootStackParamList } from './src/core/navigation/types';
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen';
import { useAuthStore } from './src/features/auth/models/authStore';
import { BankAccountSetupScreen } from './src/features/bank/views/BankAccountSetupScreen';
import { BankAccountVerifyScreen } from './src/features/bank/views/BankAccountVerifyScreen';
import { BankAccountCompleteScreen } from './src/features/bank/views/BankAccountCompleteScreen';
import { PayPasswordSetupScreen } from './src/features/bank/views/PayPasswordSetupScreen';
import { PayPasswordConfirmScreen } from './src/features/bank/views/PayPasswordConfirmScreen';
import { PayPasswordInputScreen } from './src/features/bank/views/PayPasswordInputScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [fontsLoaded, fontError] = useFonts({
    'KBO Dia Gothic Light': require('./src/assets/fonts/KBO Dia Gothic Light.otf'),
    'KBO Dia Gothic Medium': require('./src/assets/fonts/KBO Dia Gothic Medium.otf'),
    'KBO Dia Gothic Bold': require('./src/assets/fonts/KBO Dia Gothic Bold.otf'),
    'Pretendard-Thin': require('./src/assets/fonts/Pretendard-Thin.ttf'),
    'Pretendard-ExtraLight': require('./src/assets/fonts/Pretendard-ExtraLight.ttf'),
    'Pretendard-Light': require('./src/assets/fonts/Pretendard-Light.ttf'),
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('./src/assets/fonts/Pretendard-ExtraBold.ttf'),
    'Pretendard-Black': require('./src/assets/fonts/Pretendard-Black.ttf'),
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F3F5" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }} initialRouteName={isLoggedIn ? 'App' : 'Onboarding'}>
          <Stack.Screen name="Onboarding">
            {({ navigation }) => (
              <OnboardingScreen onStart={() => navigation.replace('Auth')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Auth" component={AuthNavigator} />
          <Stack.Screen name="App" component={AppNavigator} />
          <Stack.Screen name="BankAccountSetup" component={BankAccountSetupScreen} />
          <Stack.Screen name="BankAccountVerify" component={BankAccountVerifyScreen} />
          <Stack.Screen name="BankAccountComplete" component={BankAccountCompleteScreen} />
          <Stack.Screen name="PayPasswordSetup" component={PayPasswordSetupScreen} />
          <Stack.Screen name="PayPasswordConfirm" component={PayPasswordConfirmScreen} />
          <Stack.Screen name="PayPasswordInput" component={PayPasswordInputScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
