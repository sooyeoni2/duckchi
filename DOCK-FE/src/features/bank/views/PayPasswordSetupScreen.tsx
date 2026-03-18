import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Dimensions,
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

const { height: H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PayPasswordSetup'>;

const PASSWORD_LENGTH = 6;

export function PayPasswordSetupScreen() {
  const navigation = useNavigation<Nav>();
  const params = useRoute<Route>().params;
  const bankName = params?.bankName;
  const maskedAccountNo = params?.maskedAccountNo;
  const returnTo = params?.returnTo ?? 'NewUser';
  const [password, setPassword] = useState('');

  const handleChangeText = (text: string) => {
    setPassword(text);
    if (text.length === PASSWORD_LENGTH) Keyboard.dismiss();
  };

  const handleConfirm = () => {
    if (password.length !== PASSWORD_LENGTH) return;
    navigation.replace('PayPasswordConfirm', { firstPassword: password, bankName, maskedAccountNo, returnTo });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ height: H }}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <CustomAppBar
            title="결제 비밀번호 설정"
            centerTitle={false}
            showBackButton={!!bankName}
            backgroundColor={AppColorStyles.background}
            onBackPress={bankName && maskedAccountNo
              ? () => navigation.replace('BankAccountComplete', { bankName, maskedAccountNo, returnTo })
              : undefined}
          />

          <View style={styles.content}>
            <Text style={styles.title}>결제 비밀번호를{'\n'}설정해주세요!</Text>
            <PasswordDotsInput password={password} onChangeText={handleChangeText} />
          </View>

          <View style={styles.bottomArea}>
            <FilledButton
              text="확인"
              onPress={password.length === PASSWORD_LENGTH ? handleConfirm : undefined}
            />
          </View>
        </SafeAreaView>
      </View>
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
    paddingBottom: H * 0.05,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
