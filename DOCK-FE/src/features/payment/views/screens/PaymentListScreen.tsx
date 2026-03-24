import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { usePaymentListViewModel } from '../../viewmodels/usePaymentListViewModel';
import { MyExpenseItem } from '../../models/paymentTypes';
import { ExpenseHistoryCard } from '../components/ExpenseHistoryCard';

/**
 * 📋 정산 결제 내역 목록 화면 (메인 결제 탭)
 */
const PaymentListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // 🛡 route.params가 undefined일 경우를 대비한 기본값
  const params = route.params || {};
  const roomId = params.roomId || 1;
  const roomSessionId = params.roomSessionId || 0;

  const { state, filteredExpenses, loadExpenses } = usePaymentListViewModel(roomId);
  const isLoading = state.status === 'loading';
  const expenses = filteredExpenses;
  const refresh = loadExpenses;

  /**
   * 📸 영수증 스캔 진입
   */
  const handleOcrEntry = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '영수증을 찍기 위해 카메라 권한이 필요합니다.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        navigation.navigate('PaymentRegistration', {
          roomId, roomSessionId, inputType: 'OCR', initialData: { imageUri: result.assets[0].uri },
        });
      }
    } catch (e) {
      console.error('Camera error', e);
    }
  }, [navigation, roomId, roomSessionId]);

  /**
   * 🏦 계좌 내역 진입
   */
  const handleAccountEntry = useCallback(() => {
    navigation.navigate('AccountHistory', { roomId, roomSessionId });
  }, [navigation, roomId, roomSessionId]);

  /**
   * ✍️ 직접 입력 진입
   */
  const handleManualEntry = useCallback(() => {
    navigation.navigate('PaymentRegistration', { roomId, roomSessionId, inputType: 'MANUAL' });
  }, [navigation, roomId, roomSessionId]);

  const renderItem = ({ item }: { item: MyExpenseItem }) => {
    if (!item) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {/* TODO: 상세 페이지 이동 */}}
      >
        <ExpenseHistoryCard expense={item} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🛠 정산 방식 선택 섹션 (결제 탭에서만 노출) */}
      <View style={styles.entrySection}>
        <Text style={styles.entryTitle}>새로운 정산 요청</Text>
        <View style={styles.entryButtonGrid}>
          <TouchableOpacity style={styles.entryButton} onPress={handleOcrEntry}>
            <Text style={styles.entryIcon}>📷</Text>
            <Text style={styles.entryLabel}>영수증</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.entryButton} onPress={handleAccountEntry}>
            <Text style={styles.entryIcon}>🏦</Text>
            <Text style={styles.entryLabel}>계좌</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.entryButton} onPress={handleManualEntry}>
            <Text style={styles.entryIcon}>✍️</Text>
            <Text style={styles.entryLabel}>직접입력</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>최근 내역</Text>
      </View>

      <FlatList
        data={expenses || []}
        renderItem={renderItem}
        keyExtractor={(item) => (item?.expenseId || Math.random()).toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={['#34C759']} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>아직 등록된 결제 내역이 없습니다.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  entrySection: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  entryTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 16 },
  entryButtonGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  entryButton: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 12, marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F3F5' },
  entryIcon: { fontSize: 24, marginBottom: 4 },
  entryLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
  listHeader: { padding: 20, paddingBottom: 0 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  listContent: { padding: 16 },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#BBB', fontSize: 16 },
});

export default PaymentListScreen;
