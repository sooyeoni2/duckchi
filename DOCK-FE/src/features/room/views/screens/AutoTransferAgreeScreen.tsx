import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView, Edges } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { useAutoTransferAgreeViewModel } from '../../viewmodels/useAutoTransferAgreeViewModel';

import { AutoTransferConfirmBottomSheet } from '../components/AutoTransferConfirmBottomSheet';

const AutoTransferAgreeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roomId: number = route.params?.roomId;
  const roomName: string | undefined = route.params?.roomName;

  const { state, openConfirmModal, closeConfirmModal, toggleAgreement, fetchConsent } = useAutoTransferAgreeViewModel(roomId, roomName);

  useFocusEffect(
    React.useCallback(() => {
      fetchConsent();
    }, [fetchConsent])
  );

  const edges = ['top', 'bottom'] as Edges;

  if (state.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={edges}>
        <CustomAppBar
          title="자동이체 동의"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColorStyles.yellow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {/* 공용 AppBar */}
      <CustomAppBar
        title="자동이체 동의"
        centerTitle={false}
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        {/* 모임방 정보 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.roomTitle as any}>{state.roomTitle}</Text>
            {state.isAgreed ? (
              <View style={[styles.badge, styles.badgeGreen] as any}>
                <Text style={styles.badgeTextGreen as any}>동의</Text>
              </View>
            ) : (
              <View style={[styles.badge, styles.badgeRed] as any}>
                <Text style={styles.badgeTextRed as any}>미동의</Text>
              </View>
            )}
          </View>
          
          {state.isAgreed ? (
            <Text style={styles.subText as any}>동의일 : {state.agreedDate}</Text>
          ) : (
            <Text style={styles.subText as any}>정산 금액을 직접 송금해야 해요</Text>
          )}
        </View>

        {/* 안내 문구 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle as any}>자동이체 동의란?</Text>
          <View style={styles.infoBulletBox}>
            <Text style={styles.infoBullet as any}>• 정산 금액이 자동 출금돼요</Text>
            <Text style={styles.infoBullet as any}>• 비밀번호 없이 원클릭으로 정산돼요</Text>
            <Text style={styles.infoBullet as any}>• 정산전까지 언제든 취소 가능해요</Text>
          </View>
        </View>

        {/* 한도 카드 (동의 상태일 때만 보임) */}
        {state.isAgreed && (
          <>
            <View style={styles.limitCard}>
              <Text style={styles.limitLabel as any}>설정된 자동이체 한도</Text>
              <Text style={styles.limitValue as any}>
                {state.transferLimit.toLocaleString()}원
              </Text>
            </View>
            <Text style={styles.limitHint as any}>자동이체 한도는 프로필에서 변경 가능해요</Text>
          </>
        )}
      </View>

      {/* 하단 버튼 — 공용 FilledButton 사용 */}
      <View style={styles.bottomContainer}>
        <FilledButton
          text={state.isAgreed ? '동의 취소하기' : '자동이체 동의하기'}
          onPress={openConfirmModal}
        />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    padding: 24,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roomTitle: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24 }),
    color: AppColorStyles.black,
  } as any,
  badge: {
    paddingHorizontal: 16,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRed: {
    backgroundColor: '#FFEBEE',
  },
  badgeTextRed: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, letterSpacing: 0.5 }),
    color: AppColorStyles.warning,
  } as any,
  badgeGreen: {
    backgroundColor: '#E8F5E9',
  },
  badgeTextGreen: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, letterSpacing: 0.5 }),
    color: '#2E7D32',
  } as any,
  subText: {
    ...KBODiaGothicTextStyle.light({ fontSize: 13, lineHeight: 20 }),
    color: '#C2C2C2',
    marginTop: 4,
  } as any,
  infoCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    padding: 24,
  },
  infoTitle: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 20, lineHeight: 30 }),
    marginBottom: 12,
    color: AppColorStyles.black,
  } as any,
  infoBulletBox: {
    gap: 6,
  },
  infoBullet: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, lineHeight: 22 }),
    color: AppColorStyles.textSecondary,
  } as any,
  limitCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitLabel: {
    ...KBODiaGothicTextStyle.light({ fontSize: 15 }),
    color: '#000000',
  } as any,
  limitValue: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20 }),
    color: '#333333',
  } as any,
  limitHint: {
    textAlign: 'center',
    ...KBODiaGothicTextStyle.light({ fontSize: 13, lineHeight: 13 }),
    color: '#C2C2C2',
    marginTop: 4,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 8,
  },
});

export default AutoTransferAgreeScreen;
