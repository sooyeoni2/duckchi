import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { PasswordDotsInput } from '../components/PasswordDotsInput';
import { usePayPasswordViewModel } from '../viewmodels/usePayPasswordViewModel';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PayPasswordConfirm'>;

const PASSWORD_LENGTH = 6;

export function PayPasswordConfirmScreen() {
  const navigation = useNavigation<Nav>();
  const { firstPassword, bankName, maskedAccountNo, returnTo } = useRoute<Route>().params;
  const { setup, isSettingUp } = usePayPasswordViewModel();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleChangeText = (text: string) => {
    setPassword(text);
    if (error) setError('');
  };

  const handleStart = async () => {
    if (password.length !== PASSWORD_LENGTH) return;
    if (password !== firstPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setPassword('');
      return;
    }
    const res = await setup(password);
    if (res.ok) {
      navigation.replace('App');
    } else if (res.error === 'ALREADY_SET') {
      navigation.replace('App');
    } else {
      setError('비밀번호 설정에 실패했습니다. 다시 시도해주세요.');
      setPassword('');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <CustomAppBar
          title="결제 비밀번호 설정"
          centerTitle={false}
          showBackButton
          backgroundColor={AppColorStyles.background}
          onBackPress={() => navigation.replace('PayPasswordSetup', { bankName, maskedAccountNo, returnTo })}
        />

        <View style={styles.content}>
          <Text style={styles.title}>결제 비밀번호를{'\n'}다시 한번 입력해 주세요</Text>
          <PasswordDotsInput password={password} onChangeText={handleChangeText} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.bottomArea}>
          <FilledButton
            text="시작하기"
            onPress={password.length === PASSWORD_LENGTH && !isSettingUp ? handleStart : undefined}
            isLoading={isSettingUp}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 44,
    paddingTop: 60,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 26, color: AppColorStyles.black }),
    lineHeight: 32,
    marginBottom: 60,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
  },
  errorText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.danger }),
    textAlign: 'center',
    marginTop: 16,
  },
});
