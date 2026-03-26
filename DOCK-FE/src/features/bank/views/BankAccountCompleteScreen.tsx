import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { useAuthStore } from '../../auth/models/authStore';
import { updateTransferLimit } from '../../profile/models/profileService';

const { height: H } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountComplete'>;

export function BankAccountCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const { bankName, maskedAccountNo, returnTo } = useRoute<Route>().params;
  const userName = useAuthStore(s => s.user?.name ?? '');
  const hasPayPassword = useAuthStore(s => s.user?.hasPayPassword ?? false);
  const setHasBankAccount = useAuthStore(s => s.setHasBankAccount);
  const [transferLimit, setTransferLimit] = useState('');
  const limitInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleLimitChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setTransferLimit(digits ? Number(digits).toLocaleString() : '');
  };

  const isNewUserFlow = returnTo === 'NewUser';

  const handleNext = async () => {
    if (isNewUserFlow && transferLimit) {
      const amount = Number(transferLimit.replace(/,/g, ''));
      try {
        await updateTransferLimit(amount);
      } catch {}
    }
    setHasBankAccount();
    // Settings 흐름이고 이미 비밀번호가 설정된 경우 → 바로 프로필로 이동
    if (returnTo === 'Settings' && hasPayPassword) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{
            name: 'App',
            state: { index: 3, routes: [{ name: 'Home' }, { name: 'Room' }, { name: 'Report' }, { name: 'Profile' }] },
          }],
        })
      );
      return;
    }
    navigation.replace('PayPasswordSetup', { bankName, maskedAccountNo, returnTo });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ height: H }}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.content}>
            {/* 체크 아이콘 */}
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark" size={48} color="#000000" />
            </View>

            {/* 타이틀 */}
            <Text style={styles.title}>계좌 연결 완료!</Text>
            <Text style={styles.subtitle}>이제 더치페이로 빠르게{'\n'}정산할 수 있어요</Text>

            {/* 계좌 카드 */}
            <View style={styles.accountCard}>
              <Text style={styles.cardTopLabel}>{bankName} · 인증 완료</Text>
              <Text style={styles.cardAccountNo}>{maskedAccountNo}</Text>
              {userName ? <Text style={styles.cardHolder}>{userName}</Text> : null}
            </View>

            {/* 자동이체 한도 설정 - 신규유저만 */}
            {isNewUserFlow && (
              <>
                <Text style={styles.limitLabel}>자동이체 한도 설정</Text>
                <Pressable style={styles.inputRow} onPress={() => limitInputRef.current?.focus()}>
                  <Text style={styles.limitPlaceholder}>최대 출금 한도</Text>
                  <TextInput
                    ref={limitInputRef}
                    style={styles.limitInput}
                    placeholder="금액입력"
                    placeholderTextColor="#DADADA"
                    keyboardType="numeric"
                    value={transferLimit}
                    onChangeText={handleLimitChange}
                    textAlign="right"
                  />
                </Pressable>
              </>
            )}
          </View>

          {/* 다음 버튼 */}
          <View style={styles.bottomArea}>
            <FilledButton
              text={isNewUserFlow ? '다음' : '완료'}
              onPress={!isNewUserFlow || transferLimit.length > 0 ? handleNext : undefined}
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
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEEC7E',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24, color: AppColorStyles.black }),
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: '#C2C2C2' }),
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  accountCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  cardTopLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: '#DADADA' }),
  },
  cardAccountNo: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24, color: AppColorStyles.black }),
  },
  cardHolder: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12, color: '#DADADA' }),
  },
  limitLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.black }),
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColorStyles.surface,
    borderWidth: 2,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 55,
  },
  limitPlaceholder: {
    ...KBODiaGothicTextStyle.light({ fontSize: 15, color: AppColorStyles.textDisabled }),
  },
  limitInput: {
    flex: 1,
    ...KBODiaGothicTextStyle.bold({ fontSize: 20, color: AppColorStyles.black }),
    textAlign: 'right',
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
