import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAutoTransferAgreeViewModel } from '../../viewmodels/useAutoTransferAgreeViewModel';

import { AutoTransferConfirmBottomSheet } from '../components/AutoTransferConfirmBottomSheet';

const AutoTransferAgreeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { state, openConfirmModal, closeConfirmModal, toggleAgreement } = useAutoTransferAgreeViewModel();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color={AppColorStyles.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>자동이체 동의</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* 모임방 정보 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.roomTitle}>{state.roomTitle}</Text>
            {state.isAgreed ? (
              <View style={[styles.badge, styles.badgeGreen]}>
                <Text style={styles.badgeTextGreen}>동의</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeRed]}>
                <Text style={styles.badgeTextRed}>미동의</Text>
              </View>
            )}
          </View>
          
          {state.isAgreed ? (
            <Text style={styles.subText}>동의일 : {state.agreedDate}</Text>
          ) : (
            <Text style={styles.subText}>정산 금액을 직접 송금해야 해요</Text>
          )}
        </View>

        {/* 안내 문구 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>자동이체 동의란?</Text>
          <View style={styles.infoBulletBox}>
            <Text style={styles.infoBullet}>• 정산 금액이 자동 출금돼요</Text>
            <Text style={styles.infoBullet}>• 클릭 없이 정산이 끝나요</Text>
            <Text style={styles.infoBullet}>• 정산전까지 동의 취소 가능해요</Text>
          </View>
        </View>

        {/* 한도 카드 (동의 상태일 때만 보임) */}
        {state.isAgreed && (
          <>
            <View style={styles.limitCard}>
              <Text style={styles.limitLabel}>설정된 자동이체 한도</Text>
              <Text style={styles.limitValue}>
                {state.transferLimit.toLocaleString()}원
              </Text>
            </View>
            <Text style={styles.limitHint}>자동이체 한도는 프로필에서 변경 가능해요</Text>
          </>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          activeOpacity={0.8}
          onPress={openConfirmModal}
        >
          <Text style={styles.buttonText}>
            {state.isAgreed ? '동의 취소하기' : '자동이체 동의하기'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 확인 및 취소 바텀시트 모달 */}
      <AutoTransferConfirmBottomSheet 
        isVisible={state.isConfirmModalVisible}
        isCurrentlyAgreed={state.isAgreed}
        transferLimit={state.transferLimit}
        onClose={closeConfirmModal}
        onConfirm={toggleAgreement}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: AppColorStyles.background,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColorStyles.textPrimary,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12,
    padding: 24,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeRed: {
    backgroundColor: '#FFEBEE', // 연한 빨강 배경
  },
  badgeTextRed: {
    color: AppColorStyles.warning, // 빨강 텍스트
    fontSize: 13,
    fontWeight: '600',
  },
  badgeGreen: {
    backgroundColor: '#E8F5E9', // 연한 초록 배경
  },
  badgeTextGreen: {
    color: '#2E7D32', // 진한 초록 텍스트
    fontSize: 13,
    fontWeight: '600',
  },
  subText: {
    fontSize: 14,
    color: AppColorStyles.textHint,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#EBEBEB',
    borderRadius: 12,
    padding: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: AppColorStyles.black,
  },
  infoBulletBox: {
    gap: 6,
  },
  infoBullet: {
    fontSize: 15,
    color: AppColorStyles.textSecondary,
    lineHeight: 22,
  },
  limitCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitLabel: {
    fontSize: 15,
    color: AppColorStyles.textSecondary,
  },
  limitValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColorStyles.textPrimary,
  },
  limitHint: {
    textAlign: 'center',
    fontSize: 13,
    color: AppColorStyles.textHint,
    marginTop: -8,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: AppColorStyles.yellow,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
});

export default AutoTransferAgreeScreen;
