import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBankColor } from '../../../core/constants/bankColors';
import type { ProfileStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { ConfirmDialog } from '../../../shared/components/dialog/ConfirmDialog';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { FilledButton } from '../../../shared/components/buttons/FilledButton';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

export function BankAccountRegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { state, deleteAccount } = useProfileViewModel();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const accounts = state.status === 'loaded' ? state.profile.accounts : [];
  const currentAccount = accounts[0] ?? null;

  // TODO: 진행 중인 정산 여부는 별도 API 연동 필요
  const hasOngoingSettlement = false;

  const canRegister = currentAccount === null && !hasOngoingSettlement;

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
              <View style={[styles.bankCircle, { backgroundColor: bankColor.bg }]}>
                <Text style={[styles.bankCircleText, { color: bankColor.text }]}>
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

        {/* 안내 카드 */}
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            {currentAccount === null
              ? '계좌를 등록해 주세요'
              : '진행 중인 정산이 없을 때만 변경 가능해요\n변경 후 1원 인증이 필요해요'}
          </Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomArea}>
        <FilledButton
          text="계좌 등록하기"
          onPress={canRegister ? () => navigation.navigate('BankAccountSetup') : undefined}
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
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: AppColorStyles.gray2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.textDisabled }),
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
  bankCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCircleText: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 15, color: AppColorStyles.black }),
  },
  accountInfo: {
    gap: 4,
  },
  bankName: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20, color: AppColorStyles.black }),
  },
  accountNumber: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.textDisabled }),
  },
  noticeCard: {
    backgroundColor: AppColorStyles.yellowLight,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: AppColorStyles.gray2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
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
