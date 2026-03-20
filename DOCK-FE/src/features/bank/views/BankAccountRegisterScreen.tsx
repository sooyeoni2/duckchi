import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBankColor } from '../../../core/constants/bankColors';
import type { ProfileStackParamList, RootStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { ConfirmDialog } from '../../../shared/components/dialog/ConfirmDialog';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { useProfileViewModel } from '../../profile/viewmodels/useProfileViewModel';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function BankAccountRegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { state, deleteAccount } = useProfileViewModel();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const accounts = state.status === 'loaded' ? state.profile.accounts : [];
  const currentAccount = accounts[0] ?? null;

  // TODO: 비밀번호 3회 실패 여부 API 연동 필요
  const isPasswordLocked = false;

  const canRegister = currentAccount === null;

  const bankColor = currentAccount ? getBankColor(currentAccount.bankCode) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="대표 계좌 변경"
        centerTitle={false}
        showBackButton
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
        showDivider
      />

      <View style={styles.content}>
        {/* 현재 계좌 카드 */}
        {currentAccount !== null && bankColor !== null && (
          <View style={styles.accountCard}>
            <ConfirmDialog
              visible={confirmVisible}
              title="계좌 삭제"
              message="대표 계좌를 삭제하시겠습니까?"
              cancelText="취소"
              confirmText="삭제"
              confirmColor={AppColorStyles.danger}
              onCancel={() => setConfirmVisible(false)}
              onConfirm={() => {
                setConfirmVisible(false);
                deleteAccount(currentAccount.accountId);
              }}
            />
            <View style={styles.labelRow}>
              <Text style={styles.accountLabel}>대표 계좌</Text>
              <TouchableOpacity style={styles.deleteButton} onPress={() => setConfirmVisible(true)}>
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.accountRow}>
              <View style={[styles.bankIconCircle, { backgroundColor: bankColor.bg }]}>
                <Text style={[styles.bankIconText, { color: bankColor.text }]}>
                  {currentAccount.bankName.charAt(0)}
                </Text>
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.bankName}>{currentAccount.bankName}</Text>
                <Text style={styles.accountNumber}>{currentAccount.accountNumber}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 안내 카드: 계좌 없을 때 또는 비밀번호 3회 실패 시 */}
        {(currentAccount === null || isPasswordLocked) && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              {isPasswordLocked
                ? '비밀번호를 3회 틀리셨습니다.\n계좌를 삭제 후 다시 등록해 주세요.'
                : '계좌를 등록해 주세요'}
            </Text>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomArea}>
        <FilledButton
          text="계좌 등록하기"
          onPress={canRegister ? () => navigation.navigate('BankAccountSetup', { returnTo: 'Settings' }) : undefined}
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
    paddingHorizontal: 21,
    paddingTop: 20,
    gap: 12,
  },
  accountCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingTop: 16,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textHint }),
  },
  deleteButton: {
    width: 60,
    height: 24,
    borderWidth: 1,
    borderColor: AppColorStyles.danger,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 10, color: AppColorStyles.danger }),
    letterSpacing: 0.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIconText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 17, color: AppColorStyles.black }),
  },
  accountInfo: {
    gap: 8,
  },
  bankName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 22, color: AppColorStyles.black }),
  },
  accountNumber: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.textDisabled }),
  },
  noticeCard: {
    backgroundColor: AppColorStyles.yellowLight,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: AppColorStyles.yellow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  noticeText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textDisabled }),
    lineHeight: 20,
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
