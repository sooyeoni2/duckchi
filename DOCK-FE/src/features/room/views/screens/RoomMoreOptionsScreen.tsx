import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RoomStackParamList } from '@core/navigation/types';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import { useRoomMoreOptionsViewModel } from '../../viewmodels/useRoomMoreOptionsViewModel';
import { useRoomActionViewModel } from '../../viewmodels/useRoomActionViewModel';
import { RoomMenuItem } from '../components/RoomMenuItem';
import { RoomActionConfirmBottomSheet, type PendingSettlement } from '../components/RoomActionConfirmBottomSheet';
import { MeetingRoomLinkSheet } from '../../components/MeetingRoomLinkSheet';
import { getMeetingRoomInviteLinkMock } from '../../models/roomMockData';

type Route = RouteProp<RoomStackParamList, 'RoomMoreOptions'>;

const RoomMoreOptionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { roomId } = route.params;
  
  // ViewModel 훅을 통해 상태와 로직(핸들러)을 가져옴
  const { state, openInviteModal, closeInviteModal, openActionModal, closeActionModal } = useRoomMoreOptionsViewModel();
  const { roomInfo, isInviteModalVisible, activeActionType, isActionModalVisible } = state;

  const { state: actionState, startRoom, endRoom, deleteRoom, leaveRoom } = useRoomActionViewModel();

  // 팀 공용 MeetingRoomLinkSheet에서 사용할 초대 링크 Mock
  const inviteLink = getMeetingRoomInviteLinkMock(1);

  // 미완료 정산 Mock (실제 연동 시 서버 데이터로 교체)
  const pendingSettlement: PendingSettlement | undefined =
    (activeActionType === 'LEAVE' || activeActionType === 'DELETE')
      ? { count: 1, name: '고기집', amount: 20000, requester: '류병선' }
      : undefined;

  const handleActionConfirm = async () => {
    if (!activeActionType) return;

    // 미완료 정산이 있으면 정산하기 화면으로 이동
    if (pendingSettlement != null) {
      closeActionModal();
      navigation.navigate('RoomDetail', { roomId, showTransfer: true });
      return;
    }

    let success = false;
    switch (activeActionType) {
      case 'START': success = await startRoom(); break;
      case 'END': success = await endRoom(); break;
      case 'DELETE': success = await deleteRoom(); break;
      case 'LEAVE': success = await leaveRoom(); break;
    }

    if (success) {
      closeActionModal();
      if (activeActionType === 'DELETE' || activeActionType === 'LEAVE') {
        navigation.navigate('Home');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 공용 AppBar 컴포넌트 사용 */}
      <CustomAppBar
        showDivider
        backgroundColor={AppColorStyles.background}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 메인 메뉴 카드 */}
        <View style={styles.card}>
          <RoomMenuItem 
            title="초대링크 공유" 
            onPress={openInviteModal}
          />
          <RoomMenuItem title="N빵 룰렛" />
          <RoomMenuItem 
            title="자동이체 동의" 
            onPress={() => navigation.navigate('AutoTransferAgree')}
          />
          
          {roomInfo.isAdmin && (
            <RoomMenuItem 
              title="방장 위임" 
              onPress={() => navigation.navigate('AdminDelegation')}
            />
          )}
          
          <RoomMenuItem 
            title="모임방 수정" 
            onPress={() => navigation.navigate('RoomEdit')}
          />
          
          {/* 삭제: danger 색상으로 메뉴 텍스트만 시각 구분 */}
          {roomInfo.isAdmin && (
            <RoomMenuItem 
              title="모임방 삭제" 
              textColor="#0055FF"
              onPress={() => openActionModal('DELETE')}
              showBorder={false}
            />
          )}
        </View>

        {/* 나가기: warning 색상으로 메뉴 텍스트만 시각 구분 */}
        <View style={styles.card}>
          <RoomMenuItem 
            title="모임방 나가기" 
            textColor={AppColorStyles.warning} 
            showBorder={false}
            onPress={() => openActionModal('LEAVE')}
          />
        </View>
      </ScrollView>

      {/* 초대링크 공유 — 팀 공용 MeetingRoomLinkSheet 사용 */}
      <MeetingRoomLinkSheet
        visible={isInviteModalVisible}
        inviteLink={inviteLink}
        title="친구를 모임방으로 초대하기"
        showLater={false}
        onCopyLink={() => {
          Alert.alert('초대 링크', '링크가 복사되었습니다.');
        }}
        onLater={closeInviteModal}
      />

      {/* 각종 액션 확인 바텀시트 모달 (버튼 색상: 모두 노란색) */}
      {activeActionType && (
        <RoomActionConfirmBottomSheet
          isVisible={isActionModalVisible}
          type={activeActionType}
          isProcessing={actionState.isProcessing}
          pendingSettlement={pendingSettlement}
          onClose={closeActionModal}
          onConfirm={handleActionConfirm}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 32,
    gap: 16,
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default RoomMoreOptionsScreen;


