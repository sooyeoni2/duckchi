import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { CustomTextField } from '../../../shared/components/inputs/CustomTextField';
import { useBankAccountViewModel } from '../viewmodels/useBankAccountViewModel';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountVerify'>;

export function BankAccountVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { accountId, bankName, maskedAccountNo, returnTo } = route.params;

  const { verify, isVerifying } = useBankAccountViewModel();
  const { refresh } = useProfileViewModel();

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleVerify = async () => {
    if (code.length !== 4) {
      setCodeError('4자리 인증코드를 입력해주세요.');
      return;
    }

    setCodeError('');
    const res = await verify(accountId, code);

    if (res.ok) {
      await refresh();
      if (returnTo === 'Settings') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'App',
                state: {
                  routes: [
                    {
                      name: 'Profile',
                      state: {
                        routes: [
                          { name: 'ProfileMain' },
                          { name: 'Settings' },
                          { name: 'BankAccountRegister' },
                        ],
                        index: 2,
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      } else {
        navigation.replace('App');
      }
    } else if (res.error === 'LOCKED') {
      Alert.alert('잠김', '인증 실패 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.', [
        { text: '확인', onPress: () => navigation.replace('App') },
      ]);
    } else if (res.error === 'ALREADY_VERIFIED') {
      Alert.alert('알림', '이미 인증이 완료된 계좌입니다.', [
        { text: '확인', onPress: () => navigation.replace('App') },
      ]);
    } else if (res.error === 'BAD_CODE') {
      setCodeError('인증코드가 올바르지 않습니다.');
    } else {
      Alert.alert('오류', '계좌 인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.title}>1원 인증을 진행해요</Text>
        <Text style={styles.subtitle}>
          {bankName} {maskedAccountNo} 계좌로{'\n'}
          1원을 입금했어요. 입금자명 4자리를 입력해주세요.
        </Text>

        <View style={styles.inputArea}>
          <CustomTextField
            label="인증코드"
            hint="입금자명 4자리 입력"
            value={code}
            onChangeText={text => {
              setCode(text.replace(/[^0-9]/g, ''));
              if (codeError) setCodeError('');
            }}
            keyboardType="numeric"
            returnKeyType="done"
            errorText={codeError}
            maxLength={4}
            autoFocus
          />
        </View>
      </View>

      <View style={styles.bottomArea}>
        <FilledButton
          text="인증하기"
          onPress={code.length === 4 && !isVerifying ? handleVerify : undefined}
          isLoading={isVerifying}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 26, color: AppColorStyles.black }),
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, color: AppColorStyles.gray2 }),
    lineHeight: 22,
    marginBottom: 32,
  },
  inputArea: {
    marginTop: 8,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
});
