import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@features/auth/models/authStore';
import { createExpense, fetchExpenseParticipantsApi } from '../../models/services/paymentService';
import { recognizeReceiptImage } from '../../models/services/paymentOcrService';
import { usePaymentCalculation } from '../../viewmodels/hooks/usePaymentCalculation';
import AmountInput from '../components/common/AmountInput';
import MemberSelector from '../components/common/MemberSelector';
import * as ImageManipulator from 'expo-image-manipulator';
import { createProfileImageUploadUrl, uploadProfileImageToS3 } from '@features/auth/models/authService';
import { useToastStore } from '../../../../shared/stores/useToastStore';

/**
 * 📝 결제안 등록 화면 (OCR / 직접 입력 / 계좌 내역 공용)
 */
const PaymentRegistrationScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  
  const { inputType, roomId, roomSessionId, initialData } = route.params;

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);

  // 🧮 정산 계산 훅 연결
  const {
    totalAmount,
    setTotalAmount,
    participants,
    difference,
    isReadyToSubmit: isCalculationReady,
    splitEqually,
    updateParticipantAmount,
    updateParticipantsList,
  } = usePaymentCalculation({
    payerId: user?.userId || 0,
  });

  // 📝 전체 제출 준비 완료 여부 (계산 완료 + 제목 입력)
  const isReadyToSubmit = useMemo(() => {
    return isCalculationReady && title.trim().length > 0;
  }, [isCalculationReady, title]);

  /**
   * 👥 정산 가능 멤버 목록 로드
   */
  const loadParticipants = useCallback(async () => {
    try {
      const members = await fetchExpenseParticipantsApi(roomId);
      setAvailableMembers(members);
      
      // 초기 진입 시 결제자(본인)는 기본 선택
      if (user) {
        const me = members.find((m: any) => m.userId === user.userId);
        if (me) {
          updateParticipantsList([{
            userId: me.userId,
            userName: me.userName,
            splitAmount: 0
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to load participants', error);
    }
  }, [roomId, user, updateParticipantsList]);

  /**
   * 🖼 이미지 최적화 및 OCR 분석 (개선된 파이프라인)
   */
  const processOcr = useCallback(async (imageUri: string) => {
    setIsLoading(true);
    try {
      // 신규 OCR 전용 서비스 사용 (Multipart 전송 + 드래프트 생성 자동화)
      const result = await recognizeReceiptImage(roomId, imageUri, 'LIBRARY');
      
      if (result.kind === 'SUCCESS') {
        const { draft } = result;
        setTitle(draft.storeName);
        setTotalAmount(draft.totalAmount);
        setReceiptUrl(draft.imageUri); // 로컬 URI 유지 (지연 업로드 시 S3로 변환됨)
        
        useToastStore.getState().showToast('영수증 분석이 완료되었습니다.', 'success');
      } else {
        useToastStore.getState().showToast('영수증을 읽을 수 없습니다. 직접 입력해 주세요.', 'warning');
      }
    } catch (error) {
      console.error('[OCR Recognition Error]:', error);
      useToastStore.getState().showToast('OCR 서버 통신 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, setTotalAmount]);

  /**
   * 🔄 멤버 선택/해제 토글 로직
   */
  const handleToggleMember = useCallback((userId: number) => {
    const isAlreadySelected = participants.some(p => p.userId === userId);
    
    if (isAlreadySelected) {
      // 선택 해제
      updateParticipantsList(participants.filter(p => p.userId !== userId));
    } else {
      // 신규 선택
      const memberToAdd = availableMembers.find(m => m.userId === userId);
      if (memberToAdd) {
        updateParticipantsList([
          ...participants,
          {
            userId: memberToAdd.userId,
            userName: memberToAdd.userName,
            splitAmount: 0
          }
        ]);
      }
    }
  }, [participants, availableMembers, updateParticipantsList]);

  // 초기 데이터 로드
  useEffect(() => {
    loadParticipants();
    if (inputType === 'OCR' && initialData?.imageUri) {
      processOcr(initialData.imageUri);
    } else if (initialData) {
      setTitle(initialData.title || '');
      setTotalAmount(initialData.totalAmount || 0);
    }
  }, [inputType, initialData, processOcr, setTotalAmount, loadParticipants]);

  /**
   * 🚀 최종 등록 제출
   */
  const handleSubmit = async () => {
    if (!isReadyToSubmit) return;

    // 🛠 테스트용: roomSessionId가 없으면 1로 기본값 부여
    const effectiveSessionId = roomSessionId || 1;

    setIsLoading(true);
    try {
      await createExpense(roomId, {
        roomSessionId: effectiveSessionId,
        inputType,
        title,
        totalAmount,
        paidAt: new Date().toISOString(), // TODO: 실제 결제일 선택 기능 추가 가능
        receiptImageUrl: receiptUrl || undefined,
        participants: participants.map(p => ({
          userId: p.userId,
          splitAmount: p.splitAmount
        }))
      });

      useToastStore.getState().showToast('결제 정보가 성공적으로 등록되었습니다.', 'success');
      navigation.goBack();
    } catch (error) {
      const msg = error instanceof Error ? error.message : '등록 중 알 수 없는 오류가 발생했습니다.';
      useToastStore.getState().showToast(msg, 'error');
      console.error('[Expense Registration Failed]:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && inputType === 'OCR') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>영수증을 분석 중입니다...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>결제 정보</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>결제 내용</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="예: 강남역 삼겹살"
          />
        </View>

        <AmountInput 
          label="총 결제 금액"
          value={totalAmount}
          onChange={setTotalAmount}
        />

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>정산 멤버 분배</Text>
          <TouchableOpacity onPress={splitEqually} style={styles.nBbangButton}>
            <Text style={styles.nBbangText}>1/N 자동 계산</Text>
          </TouchableOpacity>
        </View>

        <MemberSelector 
          label="정산 참여 멤버 (다중 선택)"
          members={availableMembers}
          selectedUserIds={participants.map(p => p.userId)}
          onToggleMember={handleToggleMember}
        />

        {participants.map((p) => (
          <AmountInput
            key={p.userId}
            label={p.userId === user?.userId ? `${p.userName} (나)` : p.userName}
            value={p.splitAmount}
            onChange={(amount) => updateParticipantAmount(p.userId, amount)}
          />
        ))}

        {difference !== 0 && (
          <Text style={styles.differenceText}>
            차액 {difference > 0 ? `${difference}원 부족` : `${Math.abs(difference)}원 초과`}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, !isReadyToSubmit && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!isReadyToSubmit || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>정산 등록하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  textInput: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 20 },
  nBbangButton: { backgroundColor: '#34C75920', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  nBbangText: { color: '#34C759', fontWeight: '600', fontSize: 13 },
  differenceText: { textAlign: 'right', color: '#FF3B30', fontWeight: '600', marginTop: -8, marginBottom: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  submitButton: { backgroundColor: '#34C759', height: 54, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#CCC' },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

export default PaymentRegistrationScreen;
