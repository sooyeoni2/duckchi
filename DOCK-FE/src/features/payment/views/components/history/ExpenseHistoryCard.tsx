import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

/**
 * 상태값 메타데이터 - 안전한 조회를 위해 기본값(UNKNOWN) 추가
 */
const STATUS_META: any = {
  PENDING: { label: '정산 전', backgroundColor: '#FFF3CF', textColor: '#8A5A00' },
  REQUESTED: { label: '요청됨', backgroundColor: '#EAF5FF', textColor: '#155D91' },
  SETTLED: { label: '완료', backgroundColor: '#EBF8EE', textColor: '#2D7A43' },
  UNKNOWN: { label: '확인중', backgroundColor: '#F0F0F0', textColor: '#999' },
};

const INPUT_META: any = {
  MANUAL: { label: '직접 입력', iconName: 'pencil-outline' },
  ACCOUNT_HISTORY: { label: '계좌 내역', iconName: 'bank-outline' },
  OCR: { label: 'OCR', iconName: 'file-document-outline' },
  UNKNOWN: { label: '기타', iconName: 'help-circle-outline' },
};

export function ExpenseHistoryCard({ expense }: { expense: any }) {
  // 🛡 1단계 방어: expense 객체 자체가 없는 경우 빈 뷰 반환
  if (!expense) return null;

  // 🛡 2단계 방어: status나 inputType이 예상 밖인 경우 UNKNOWN 처리
  const statusMeta = STATUS_META[expense.status] || STATUS_META.UNKNOWN;
  const inputMeta = INPUT_META[expense.inputType] || INPUT_META.UNKNOWN;

  const formatAmount = (amount: number) => `${(amount || 0).toLocaleString()}원`;
  const formatDate = (date: Date | null) => {
    if (!date) return '일시 미정';
    try {
      return `${date.getMonth() + 1}.${date.getDate().toString().padStart(2, '0')}`;
    } catch {
      return '일시 미정';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.titleText}>{expense.title || '제목 없음'}</Text>
          <Text style={styles.subText}>정산 참여 {expense.participantCount || 0}명</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusMeta.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusMeta.textColor }]}>
            {statusMeta.label}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialDesignIcons name={inputMeta.iconName} size={16} color="#888" />
        <Text style={styles.infoText}>{inputMeta.label}</Text>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.dateText}>{formatDate(expense.paidAt)}</Text>
        <Text style={styles.amountText}>{formatAmount(expense.totalAmount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  titleWrap: { flex: 1, paddingRight: 12 },
  titleText: { fontSize: 16, fontWeight: '700', color: '#000' },
  subText: { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#888', marginLeft: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 13, color: '#888' },
  amountText: { fontSize: 18, fontWeight: '800', color: '#000' },
});
