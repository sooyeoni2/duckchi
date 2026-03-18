import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ProfileStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

const { width: W } = Dimensions.get('window');
const s = W / 412;

const MIN_AMOUNT = 10000;
const MAX_AMOUNT = 100000;

function formatAmount(value: number) {
  return value.toLocaleString('ko-KR');
}

export function TransferLimitScreen() {
  const navigation = useNavigation<Nav>();
  const { state, updateTransferLimit } = useProfileViewModel();
  const currentLimit = state.status === 'loaded' ? state.profile.transferLimit : 0;
  const inputRef = useRef<TextInput>(null);

  const [rawValue, setRawValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [caretVisible, setCaretVisible] = useState(true);

  useEffect(() => {
    if (!isFocused) return;
    setCaretVisible(true);
    const id = setInterval(() => setCaretVisible(v => !v), 500);
    return () => clearInterval(id);
  }, [isFocused]);

  const numericValue = parseInt(rawValue || '0', 10);
  const isValid = numericValue >= MIN_AMOUNT && numericValue <= MAX_AMOUNT;

  const handleChangeText = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const trimmed = digits.replace(/^0+/, '') || '0';
    setRawValue(trimmed === '0' ? '' : trimmed);
  };

  const displayText = rawValue ? parseInt(rawValue, 10).toLocaleString('ko-KR') : '';

  // 밑줄 높이 = marginTop + height + marginBottom = 8*s + 1 + 12*s
  const underlineTotalHeight = 8 * s + 1 + 12 * s;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="자동이체 한도 변경"
        centerTitle={false}
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
        showDivider
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          {/* 금액 범위 힌트 */}
          <Text style={styles.hint}>금액 1만원 ~ 10만원</Text>

          {/* 숫자 + 원 가로 배치, 밑줄은 숫자 바로 아래 */}
          <View style={styles.amountRow}>
            {/* 숫자 컬럼: 숫자+커서 위, 밑줄 아래 */}
            <TouchableOpacity
              style={styles.numberColumn}
              activeOpacity={0.7}
              onPress={() => inputRef.current?.focus()}
            >
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={rawValue}
                onChangeText={handleChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardType="number-pad"
                maxLength={7}
                caretHidden
              />
              {/* 숫자 + 커서 */}
              <View style={styles.amountTextRow}>
                <Text style={[styles.amount, !displayText && styles.amountPlaceholder]}>
                  {displayText || '0'}
                </Text>
                <View style={[styles.caret, { opacity: isFocused && caretVisible ? 1 : 0 }]} />
              </View>
              {/* 밑줄 — 숫자 너비에 맞게 stretch */}
              <View style={styles.underline} />
            </TouchableOpacity>

            {/* 원 — 숫자 바닥에 맞춤 (밑줄 높이만큼 올림) */}
            <Text style={[styles.unit, { marginBottom: 4 * s + underlineTotalHeight }]}>원</Text>
          </View>

          {/* 현재 한도 */}
          <Text style={styles.currentLimit}>
            현재 한도 : {formatAmount(currentLimit)}원
          </Text>

          {/* 유효성 안내 */}
          {rawValue !== '' && !isValid && (
            <Text style={styles.errorText}>
              {numericValue < MIN_AMOUNT ? '최소 1만원 이상 입력해주세요' : '최대 10만원까지 입력 가능해요'}
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.bottomArea}>
        <FilledButton
          text="변경하기"
          onPress={isValid ? async () => { await updateTransferLimit(numericValue); navigation.goBack(); } : undefined}
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
    alignItems: 'center',
    paddingTop: 100 * s,
  },
  hint: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 * s, color: '#C2C2C2' }),
    marginBottom: 24 * s,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  numberColumn: {
    alignItems: 'center',
  },
  amountTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  caret: {
    width: 2,
    height: 36 * s,
    backgroundColor: AppColorStyles.black,
    marginLeft: 2,
    marginBottom: 4 * s,
  },
  amount: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 36 * s, color: AppColorStyles.black }),
  },
  amountPlaceholder: {
    color: AppColorStyles.gray2,
  },
  unit: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 24 * s, color: AppColorStyles.black }),
    marginLeft: 8 * s,
  },
  underline: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: AppColorStyles.black,
    marginTop: 8 * s,
    marginBottom: 12 * s,
  },
  currentLimit: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 * s, color: AppColorStyles.gray2 }),
  },
  errorText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 11 * s, color: AppColorStyles.danger }),
    marginTop: 8 * s,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
