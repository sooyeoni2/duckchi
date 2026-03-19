import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useRoomMoreOptionsViewModel } from '../../viewmodels/useRoomMoreOptionsViewModel';
import { useRoomActionViewModel } from '../../viewmodels/useRoomActionViewModel';
import { RoomMenuItem } from '../components/RoomMenuItem';
import { InviteLinkBottomSheet } from '../components/InviteLinkBottomSheet';
import { RoomActionConfirmBottomSheet } from '../components/RoomActionConfirmBottomSheet';

const RoomMoreOptionsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // ViewModel 훅을 통해 상태와 로직(핸들러)을 가져옴
  const { state, openInviteModal, closeInviteModal, openActionModal, closeActionModal } = useRoomMoreOptionsViewModel();
  const { roomInfo, isInviteModalVisible, activeActionType, isActionModalVisible } = state;

  const { state: actionState, startRoom, endRoom, deleteRoom, leaveRoom } = useRoomActionViewModel();

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color={AppColorStyles.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>더보기</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 모임방 정보 헤더 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{roomInfo.title}</Text>
          <Text style={styles.infoSubtitle}>
            {roomInfo.category} · {roomInfo.memberCount}명 · {roomInfo.status === 'READY' ? '준비중' : roomInfo.status === 'START' ? '진행중' : '종료됨'}
          </Text>
        </View>

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
          
          {roomInfo.isAdmin && (
            <RoomMenuItem 
              title="모임방 삭제" 
              textColor="#007AFF" // 주의 행동 (파란색)
              onPress={() => openActionModal('DELETE')}
              showBorder={false}
            />
          )}
        </View>

        {/* 위험 구역 카드 (나가기) */}
        <View style={styles.card}>
          <RoomMenuItem 
            title="모임방 나가기" 
            textColor={AppColorStyles.warning} 
            showBorder={false}
            onPress={() => openActionModal('LEAVE')}
          />
        </View>
      </ScrollView>

      {/* 초대링크 공유 바텀시트 모달 (분리된 컴포넌트) */}
      <InviteLinkBottomSheet
        isVisible={isInviteModalVisible}
        onClose={closeInviteModal}
        inviteLink={roomInfo.inviteLink}
      />

      {/* 각종 액션 확인 바텀시트 모달 */}
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
  scrollContent: {
    padding: 16,
    paddingTop: 8,
    gap: 16,
  },
  infoCard: {
    backgroundColor: AppColorStyles.surface, 
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColorStyles.black,
  },
  infoSubtitle: {
    fontSize: 14,
    color: AppColorStyles.textHint,
    fontWeight: '500',
  },
  card: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default RoomMoreOptionsScreen;
