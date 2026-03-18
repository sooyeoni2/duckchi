import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountComplete'>;

export function BankAccountCompleteScreen() {
  const navigation = useNavigation<Nav>();
  const { bankName, maskedAccountNo, returnTo } = useRoute<Route>().params;
  const userName = useAuthStore(s => s.user?.name ?? '');
  const [transferLimit, setTransferLimit] = useState('');
  const limitInputRef = useRef<TextInput>(null);

  const handleLimitChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    setTransferLimit(digits ? Number(digits).toLocaleString() : '');
  };

  const handleNext = () => {
    // TODO: 한도 저장 API 연동
    if (returnTo === 'NewUser') {
      navigation.replace('PayPasswordSetup');
    } else {
      navigation.replace('App');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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

            {/* 자동이체 한도 설정 */}
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
          </View>

          {/* 다음 버튼 */}
          <View style={styles.bottomArea}>
            <FilledButton text="다음" onPress={handleNext} />
          </View>
        </KeyboardAvoidingView>
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 28,
    shadowColor: AppColorStyles.gray2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
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
  limitHint: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 11, color: '#DADADA' }),
    marginTop: 6,
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
});
