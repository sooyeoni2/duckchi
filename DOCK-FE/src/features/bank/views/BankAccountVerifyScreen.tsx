import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

const { height: H } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { useLockedBanksStore } from '../models/lockedBanksStore';
import { useBankAccountViewModel } from '../viewmodels/useBankAccountViewModel';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountVerify'>;

const TIMER_SECONDS = 5 * 60;

export function BankAccountVerifyScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { accountId, bankName, maskedAccountNo, returnTo } = route.params;

  const { verify, isVerifying } = useBankAccountViewModel();
  const { refresh } = useProfileViewModel();
  const lockBank = useLockedBanksStore(s => s.lockBank);

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (timeLeft <= 0) {
      Alert.alert('시간 초과', '인증 시간이 만료되었습니다.\n계좌 인증을 다시 진행해 주세요.', [
        { text: '확인', onPress: () => navigation.replace('BankAccountSetup', { returnTo }) },
      ]);
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [navigation, returnTo, timeLeft]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const handleVerify = async () => {
    if (code.length !== 4) {
      setCodeError('4자리 인증코드를 입력해주세요.');
      return;
    }

    setCodeError('');
    const res = await verify(accountId, code);

    if (res.ok) {
      await refresh();
      navigation.replace('BankAccountComplete', {
        bankName,
        maskedAccountNo,
        returnTo,
      });
    } else if (res.error === 'LOCKED') {
      lockBank(route.params.bankCode);
      Alert.alert('잠김', '인증 번호를 3회 틀리셨습니다.\n계좌를 다시 등록해 주세요.', [
        {
          text: '확인',
          onPress: () => navigation.replace('BankAccountSetup', { returnTo }),
        },
      ]);
    } else if (res.error === 'ALREADY_VERIFIED') {
      Alert.alert('알림', '이미 인증이 완료된 계좌입니다.', [
        { text: '확인', onPress: () => navigation.replace('App') },
      ]);
    } else if (res.error === 'BAD_CODE') {
      setCodeError('인증코드가 올바르지 않습니다.');
    } else if (res.error === 'BAD_GATEWAY') {
      Alert.alert('오류', '계좌 인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } else {
      Alert.alert('오류', '계좌 인증에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ height: H }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CustomAppBar
          showBackButton
          backgroundColor={AppColorStyles.background}
          onBackPress={() => navigation.replace('BankAccountSetup', { returnTo })}
        />

        <View style={styles.content}>
          <Text style={styles.title}>1원을 보냈어요!{'\n'}입금자명을 확인해 주세요</Text>

          <View style={styles.accountCard}>
            <Text style={styles.cardBankName}>{bankName}</Text>
            <Text style={styles.cardAccountNo}>{maskedAccountNo}</Text>
          </View>

          <View style={styles.inputArea}>
            <Text style={styles.inputHint}>입금자명 4자리 입력</Text>
            <Pressable style={styles.codeRowWrapper} onPress={() => inputRef.current?.focus()}>
              <View style={styles.codeRow}>
                {[0, 1, 2, 3].map(i => (
                  <View key={i} style={styles.codeBox}>
                    <Text style={styles.codeChar}>{code[i] ?? ''}</Text>
                    <View
                      style={[
                        styles.codeUnderline,
                        { backgroundColor: code[i] ? AppColorStyles.black : '#BDBDBD' },
                      ]}
                    />
                  </View>
                ))}
              </View>
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={text => {
                  const next = text.slice(0, 4);
                  setCode(next);
                  if (codeError) setCodeError('');
                  if (next.length === 4) Keyboard.dismiss();
                }}
                maxLength={4}
                autoFocus
                autoCapitalize="characters"
                caretHidden
                style={styles.overlayInput}
              />
            </Pressable>
            {codeError && <Text style={styles.errorText}>{codeError}</Text>}
            <Text style={styles.timer}>남은 시간 {minutes} : {seconds}</Text>
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
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 26, color: AppColorStyles.black }),
    lineHeight: 32,
    marginBottom: 38,
  },
  accountCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 56,
    shadowColor: AppColorStyles.gray2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    gap: 10,
  },
  cardBankName: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: '#C2C2C2' }),
  },
  cardAccountNo: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24, color: AppColorStyles.black }),
  },
  inputArea: {
    alignItems: 'center',
    gap: 16,
  },
  inputHint: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: '#DADADA' }),
    marginBottom: 21,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 24,
  },
  codeBox: {
    alignItems: 'center',
    gap: 8,
  },
  codeChar: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24, color: AppColorStyles.black }),
    width: 50,
    textAlign: 'center',
  },
  codeUnderline: {
    width: 50,
    height: 2,
  },
  timer: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: '#C2C2C2' }),
  },
  errorText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.danger }),
  },
  codeRowWrapper: {
    position: 'relative',
  },
  overlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
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
