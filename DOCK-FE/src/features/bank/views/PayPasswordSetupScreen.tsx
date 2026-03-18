import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PASSWORD_LENGTH = 6;

export function PayPasswordSetupScreen() {
  const navigation = useNavigation<Nav>();
  const [password, setPassword] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleConfirm = () => {
    if (password.length !== PASSWORD_LENGTH) return;
    // TODO: 비밀번호 설정 API 연동 (POST /api/v1/pay-password)
    navigation.replace('App');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <CustomAppBar
        title="결제 비밀번호 설정"
        centerTitle={false}
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.title}>결제 비밀번호를{'\n'}설정해주세요!</Text>

        {/* 6자리 원형 도트 */}
        <TouchableOpacity
          style={styles.dotsRow}
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
        >
          {Array.from({ length: PASSWORD_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < password.length ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </TouchableOpacity>

        {/* 숨겨진 숫자 입력 */}
        <TextInput
          ref={inputRef}
          value={password}
          onChangeText={text => setPassword(text.replace(/[^0-9]/g, '').slice(0, PASSWORD_LENGTH))}
          keyboardType="numeric"
          maxLength={PASSWORD_LENGTH}
          autoFocus
          caretHidden
          style={styles.hiddenInput}
        />
      </View>

      <View style={styles.bottomArea}>
        <FilledButton
          text="확인"
          onPress={password.length === PASSWORD_LENGTH ? handleConfirm : undefined}
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
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dotFilled: {
    backgroundColor: AppColorStyles.black,
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: AppColorStyles.black,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
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
