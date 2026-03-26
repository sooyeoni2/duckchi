import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePaymentAccountHistoryViewModel } from '../../viewmodels/usePaymentAccountHistoryViewModel';
import { AccountHistoryItem } from '../../models/types/paymentTypes';

/**
 * 🏦 계좌 거래 내역 선택 화면
 */
const AccountHistoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { roomId, roomSessionId } = route.params;

  const { historyState, refresh } = usePaymentAccountHistoryViewModel(roomId);

  /**
   * ✅ 거래 내역 항목 선택 시 등록 화면으로 이동
   */
  const handleSelectItem = useCallback((item: AccountHistoryItem) => {
    navigation.navigate('PaymentRegistration', {
      roomId,
      roomSessionId,
      inputType: 'ACCOUNT_HISTORY',
      initialData: {
        title: item.transactionMemo,
        totalAmount: item.amount,
        paidAt: item.transactionAt, // 원본 날짜 문자열 사용
      },
    });
  }, [navigation, roomId, roomSessionId]);

  const renderItem = ({ item }: { item: AccountHistoryItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleSelectItem(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemInfo}>
        <Text style={styles.itemMemo}>{item.transactionMemo}</Text>
        <Text style={styles.itemDate}>
          {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.itemAmount}>
        -{item.amount.toLocaleString()}원
      </Text>
    </TouchableOpacity>
  );

  const isLoading = historyState.status === 'loading';
  const histories = historyState.status === 'loaded' ? historyState.histories : [];
  const error = historyState.status === 'error' ? historyState.message : null;

  if (isLoading && histories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>거래 내역을 불러오는 중...</Text>
      </View>
    );
  }

  if (error && histories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>정산할 내역 선택</Text>
        <Text style={styles.headerSubtitle}>최근 7일간의 출금 내역입니다.</Text>
      </View>

      <FlatList
        data={histories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} colors={['#34C759']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {historyState.status === 'empty' ? '조회된 거래 내역이 없습니다.' : ''}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  listContent: { paddingBottom: 20 },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemInfo: { flex: 1 },
  itemMemo: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemDate: { fontSize: 13, color: '#999' },
  itemAmount: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },
  loadingText: { marginTop: 12, color: '#666' },
  errorText: { color: '#FF3B30', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '600' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 15 },
});

export default AccountHistoryScreen;
