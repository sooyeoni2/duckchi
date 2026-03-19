import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAdminDelegationViewModel } from '../../viewmodels/useAdminDelegationViewModel';
import { AdminDelegationConfirmBottomSheet } from '../components/AdminDelegationConfirmBottomSheet';

const AdminDelegationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { 
    state, 
    selectedMemberName,
    selectParticipant, 
    openConfirmModal, 
    closeConfirmModal, 
    confirmDelegation 
  } = useAdminDelegationViewModel();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color={AppColorStyles.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>방장 위임</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* 안내 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>방장 권한을 넘길 참여자를 선택하세요</Text>
          <Text style={styles.infoText}>위임 후에는 취소할 수 없어요</Text>
        </View>

        {/* 참여자 리스트 */}
        <ScrollView style={styles.listCard} showsVerticalScrollIndicator={false}>
          {state.members.filter(m => m.role !== 'ADMIN').map((m, index, filteredArr) => {
            const isSelected = m.userId === state.selectedUserId;
            return (
              <TouchableOpacity
                key={m.userId}
                style={[
                  styles.participantRow,
                  index === filteredArr.length - 1 && styles.lastParticipantRow
                ]}
                activeOpacity={0.7}
                onPress={() => selectParticipant(m.userId)}
              >
                <View style={styles.participantInfo}>
                  <View style={styles.avatarPlaceholder}>
                    <Feather name="user" size={20} color={AppColorStyles.textHint} />
                  </View>
                  <Text style={styles.participantName}>{m.name}</Text>
                </View>
                
                {/* 체크박스 UI */}
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <AntDesign name="check" size={14} color={AppColorStyles.surface} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.primaryButton, !state.selectedUserId && styles.disabledButton]} 
          activeOpacity={0.8}
          onPress={openConfirmModal}
          disabled={!state.selectedUserId}
        >
          <Text style={styles.buttonText}>방장 위임하기</Text>
        </TouchableOpacity>
      </View>

      {/* 확정 모달 */}
      <AdminDelegationConfirmBottomSheet 
        isVisible={state.isConfirmModalVisible}
        selectedName={selectedMemberName}
        onClose={closeConfirmModal}
        onConfirm={async () => {
          const success = await confirmDelegation();
          if (success) {
            navigation.goBack();
          }
        }}
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
  infoCard: {
    backgroundColor: '#FFF8E1', // 매우 연한 노란 배경 (임시)
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF3E0',
  },
  infoText: {
    fontSize: 15,
    color: AppColorStyles.textHint,
    lineHeight: 22,
    fontWeight: '500',
  },
  listCard: {
    backgroundColor: AppColorStyles.surface, // 흰색 카드
    borderRadius: 12,
    padding: 8,
    flex: 1,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  lastParticipantRow: {
    // 마지막 줄에는 밑줄 없음
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColorStyles.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColorStyles.textPrimary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: AppColorStyles.textHint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#555555', // 진한 회색 (체크됨)
    borderColor: '#555555',
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
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
});

export default AdminDelegationScreen;
