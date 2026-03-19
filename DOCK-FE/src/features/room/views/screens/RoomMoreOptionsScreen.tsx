import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { useNavigation } from '@react-navigation/native';
import { CustomAppBar } from '@shared/components/app_bar/CustomAppBar';

import { useRoomMoreOptionsViewModel } from '../../viewmodels/useRoomMoreOptionsViewModel';
import { useRoomActionViewModel } from '../../viewmodels/useRoomActionViewModel';
import { RoomMenuItem } from '../components/RoomMenuItem';
import { RoomActionConfirmBottomSheet } from '../components/RoomActionConfirmBottomSheet';
import { MeetingRoomLinkSheet } from '../../components/MeetingRoomLinkSheet';
import { getMeetingRoomInviteLinkMock } from '../../models/roomMockData';

const RoomMoreOptionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // ViewModel 훅을 통해 상태와 로직(핸들러)을 가져옴
  const { state, openInviteModal, closeInviteModal, openActionModal, closeActionModal } = useRoomMoreOptionsViewModel();
  const { roomInfo, isInviteModalVisible, activeActionType, isActionModalVisible } = state;

  const { state: actionState, startRoom, endRoom, deleteRoom, leaveRoom } = useRoomActionViewModel();

  // 팀 공용 MeetingRoomLinkSheet에서 사용할 초대 링크 Mock
  const inviteLink = getMeetingRoomInviteLinkMock(1);

  const handleActionConfirm = async () => {
    if (!activeActionType) return;

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
        navigation.navigate('Home'); // 임시로 홈으로 이동
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 공용 AppBar 컴포넌트 사용 */}
      <CustomAppBar
        title="더보기"
        centerTitle={true}
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
          <RoomMenuItem title="총무 뽑기" />
          
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
              textColor={AppColorStyles.danger}
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
    paddingTop: 8,
    gap: 16,
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default RoomMoreOptionsScreen;


