import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';
import { FilledButton } from '@shared/components/buttons/FilledButton';
import { useAutoTransferJoinViewModel } from '../../viewmodels/useAutoTransferJoinViewModel';
import { MeetingRoomLinkSheet } from '../../components/MeetingRoomLinkSheet';
import { getMeetingRoomInviteLinkMock } from '../../models/roomMockData';
import type { RoomStackParamList } from '@core/navigation/types';

type AutoTransferJoinScreenRouteProp = RouteProp<RoomStackParamList, 'AutoTransferJoin'>;
type AutoTransferNavigationProp = NativeStackNavigationProp<RoomStackParamList>;

const AutoTransferJoinScreen: React.FC = () => {
  const navigation = useNavigation<AutoTransferNavigationProp>();
  const route = useRoute<AutoTransferJoinScreenRouteProp>();
  const roomId = route.params?.roomId || -1;
  const roomName = route.params?.roomName || '모임방';
  const inviteToken = route.params?.inviteToken;

  const { state, setRoomInfo, validateInviteBeforeJoin, agreeAndJoin, skipAndJoin } = useAutoTransferJoinViewModel(roomId);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [isInviteValidating, setIsInviteValidating] = useState(Boolean(inviteToken));
  
  const inviteLink = getMeetingRoomInviteLinkMock(roomId);

  useEffect(() => {
    setRoomInfo(roomName);
  }, [roomName, setRoomInfo]);

  useEffect(() => {
    let isMounted = true;

    const validateInvite = async () => {
      if (!inviteToken) {
        setIsInviteValidating(false);
        return;
      }

      setIsInviteValidating(true);
      const result = await validateInviteBeforeJoin(inviteToken);

      if (!isMounted) {
        return;
      }

      if (result === 'already-participant') {
        // 왜: 이미 참여한 사용자는 동의 페이지를 다시 거치지 않고 즉시 모임 상세로 보내야 UX가 끊기지 않는다.
        Alert.alert('안내', '이미 참여 중인 모임입니다.');
        navigation.replace('RoomDetail', { roomId });
        return;
      }

      if (result === 'invalid') {
        navigation.replace('RoomList');
        return;
      }

      setIsInviteValidating(false);
    };

    void validateInvite();

    return () => {
      isMounted = false;
    };
  }, [inviteToken, navigation, roomId, validateInviteBeforeJoin]);

  const handleAgree = async () => {
    if (state.isProcessing || isInviteValidating) return;
    const result = await agreeAndJoin(inviteToken);
    if (result === 'invite-joined' || result === 'already-participant') {
      navigation.replace('RoomDetail', { roomId });
      return;
    }
    if (result === 'consent-only') {
      setSheetVisible(true);
    }
  };

  const handleSkip = async () => {
    if (state.isProcessing || isInviteValidating) return;
    const result = await skipAndJoin(inviteToken);
    if (result === 'invite-joined' || result === 'already-participant') {
      navigation.replace('RoomDetail', { roomId });
      return;
    }
    if (result === 'consent-only') {
      setSheetVisible(true);
    }
  };

  const handleCopyLink = () => {
    Alert.alert('초대 링크', '링크가 복사되었습니다.');
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    navigation.navigate('RoomList');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom'] as const}>
      <CustomAppBar
        centerTitle={false}
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <Text style={styles.logoTitle}>Duckchi</Text>

        <View style={styles.mainCard}>
          <Text style={styles.cardTopLabel}>정산 동의 요청</Text>
          <Text style={styles.roomNameLabel}>{state.roomTitle}</Text>
          <Text style={styles.creatorLabel}>{state.creatorName}님이 만든 모임</Text>
          {isInviteValidating ? (
            <Text style={styles.validationNotice}>초대 링크를 확인하고 있어요...</Text>
          ) : null}
        </View>

        <View style={styles.grayCard}>
          <Text style={styles.grayCardTitle}>자동이체 동의란?</Text>
          <Text style={styles.bulletItem}>• 정산 금액이 자동 출금돼요</Text>
          <Text style={styles.bulletItem}>• 비밀번호 없이 원클릭으로 정산돼요</Text>
          <Text style={styles.bulletItem}>• 정산전까지 동의 취소 가능해요</Text>
        </View>

        <View style={styles.limitCard}>
          <Text style={styles.limitLabel}>설정된 자동이체 한도</Text>
          <Text style={styles.limitAmount}>
            {state.transferLimit.toLocaleString()}원
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <FilledButton
          text="동의 후 모임 참여"
          onPress={handleAgree}
          isLoading={state.isProcessing || isInviteValidating}
        />
        <TouchableOpacity
          onPress={handleSkip}
          disabled={state.isProcessing || isInviteValidating}
          style={styles.skipButton}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>동의 없이 참여</Text>
        </TouchableOpacity>
      </View>

      <MeetingRoomLinkSheet
        visible={sheetVisible}
        inviteLink={inviteLink}
        onCopyLink={handleCopyLink}
        onLater={handleCloseSheet}
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
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  logoTitle: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24 }),
    color: AppColorStyles.black,
    marginBottom: 24,
    textAlign: 'center',
  },
  mainCard: {
    padding: 24,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTopLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, letterSpacing: 0.5 }),
    color: '#555555',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    marginBottom: 12,
  },
  roomNameLabel: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 24 }),
    color: AppColorStyles.black,
    marginBottom: 6,
  },
  creatorLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14 }),
    color: AppColorStyles.textSecondary,
  },
  validationNotice: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12 }),
    color: AppColorStyles.gray1,
    marginTop: 8,
  },
  grayCard: {
    backgroundColor: '#F5F5F5',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  grayCardTitle: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 18 }),
    color: AppColorStyles.black,
    marginBottom: 12,
  },
  bulletItem: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15, lineHeight: 26 }),
    color: AppColorStyles.textSecondary,
  },
  limitCard: {
    padding: 24,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 15 }),
    color: AppColorStyles.black,
  },
  limitAmount: {
    ...KBODiaGothicTextStyle.bold({ fontSize: 20 }),
    color: AppColorStyles.black,
  },
  bottomContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  skipButton: {
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  skipButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16 }),
    color: AppColorStyles.textSecondary,
    textDecorationLine: 'underline',
  },
});

export default AutoTransferJoinScreen;
