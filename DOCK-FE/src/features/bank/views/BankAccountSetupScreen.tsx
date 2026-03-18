import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBankColor } from '../../../core/constants/bankColors';
import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { CustomTextField } from '../../../shared/components/inputs/CustomTextField';
import { useLockedBanksStore } from '../models/lockedBanksStore';
import { useBankAccountViewModel } from '../viewmodels/useBankAccountViewModel';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BankAccountSetup'>;

const BANKS = [
  { code: '004', name: '국민은행' },
  { code: '088', name: '신한은행' },
  { code: '081', name: 'KEB하나' },
  { code: '020', name: '우리은행' },
  { code: '090', name: '카카오뱅크' },
  { code: '003', name: '기업은행' },
  { code: '011', name: '농협은행' },
  { code: '023', name: 'SC제일' },
  { code: '002', name: '산업은행' },
  { code: '001', name: '한국은행' },
  { code: '032', name: '대구은행' },
  { code: '034', name: '광주은행' },
  { code: '035', name: '제주은행' },
  { code: '037', name: '전북은행' },
  { code: '039', name: '경남은행' },
  { code: '045', name: '새마을금고' },
  { code: '027', name: '시티은행' },
  { code: '999', name: '싸피은행' },
];

export function BankAccountSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { returnTo } = useRoute<Route>().params;
  const checkIsLocked = useLockedBanksStore(s => s.isLocked);
  const { register, isRegistering } = useBankAccountViewModel();

  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedBank, setSelectedBank] = useState<(typeof BANKS)[0] | null>(null);
  const [accountNo, setAccountNo] = useState('');
  const [accountNoError, setAccountNoError] = useState('');

  const handleSubmit = async () => {
    if (!selectedBank) return;

    const trimmed = accountNo.trim();
    if (trimmed.length < 10) {
      setAccountNoError('계좌번호를 올바르게 입력해주세요.');
      return;
    }

    setAccountNoError('');
    const res = await register(selectedBank.code, trimmed);

    if (res.ok) {
      navigation.replace('BankAccountVerify', {
        accountId: res.result.accountId,
        bankCode: selectedBank.code,
        bankName: res.result.bankName,
        maskedAccountNo: res.result.maskedAccountNo,
        returnTo,
      });
    } else if (res.error === 'CONFLICT') {
      Alert.alert('알림', '이미 등록된 계좌입니다.');
    } else if (res.error === 'BAD_REQUEST') {
      setAccountNoError('계좌번호 형식이 올바르지 않습니다.');
    } else {
      Alert.alert('오류', '계좌 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const canSubmit = selectedBank !== null && accountNo.trim().length >= 10 && !isRegistering;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CustomAppBar
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>계좌를 연결해요</Text>

        <FlatList
          data={BANKS}
          numColumns={3}
          keyExtractor={item => item.code}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const color = getBankColor(item.code);
            const isSelected = selectedBank?.code === item.code;
            const isLocked = checkIsLocked(item.code);
            return (
              <TouchableOpacity
                style={[styles.bankTile, isSelected && styles.bankTileSelected, isLocked && styles.bankTileLocked]}
                onPress={() => !isLocked && setSelectedBank(item)}
                activeOpacity={isLocked ? 1 : 0.7}
              >
                <View style={[styles.bankCircle, { backgroundColor: isLocked ? '#E0E0E0' : color.bg }]}>
                  <Text style={[styles.bankCircleText, { color: isLocked ? '#BDBDBD' : color.text }]}>
                    {item.name.charAt(0)}
                  </Text>
                </View>
                <Text style={[styles.bankLabel, isLocked && styles.bankLabelLocked]} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          style={styles.bankGrid}
        />

        <View style={styles.inputArea}>
          <CustomTextField
            label="계좌번호"
            hint="계좌번호를 입력해주세요"
            value={accountNo}
            onChangeText={text => {
              setAccountNo(text.replace(/[^0-9]/g, ''));
              if (accountNoError) setAccountNoError('');
            }}
            onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardType="numeric"
            returnKeyType="done"
            errorText={accountNoError}
            maxLength={16}
          />
        </View>

        <View style={styles.buttonArea}>
          <FilledButton
            text="1원 인증하기"
            onPress={canSubmit ? handleSubmit : undefined}
            isLoading={isRegistering}
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 26, color: AppColorStyles.black }),
    lineHeight: 32,
    marginBottom: 20,
  },
  bankGrid: {
    marginHorizontal: -4,
  },
  bankTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColorStyles.gray4,
    backgroundColor: AppColorStyles.surface,
  },
  bankTileSelected: {
    borderColor: AppColorStyles.black,
    backgroundColor: AppColorStyles.surface,
  },
  bankTileLocked: {
    opacity: 0.4,
  },
  bankLabelLocked: {
    color: '#BDBDBD',
  },
  bankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  bankCircleText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 18, color: AppColorStyles.black }),
  },
  bankLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 11, color: AppColorStyles.black }),
    textAlign: 'center',
  },
  inputArea: {
    marginTop: 24,
  },
  buttonArea: {
    marginTop: 32,
    paddingBottom: 24,
  },
});
