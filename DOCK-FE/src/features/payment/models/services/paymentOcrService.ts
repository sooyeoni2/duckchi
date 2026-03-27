import * as ImageManipulator from 'expo-image-manipulator';
import { fetchOcrAnalysisMultipartApi, fetchExpenseParticipantsApi } from '../api/paymentApi';
import { Alert } from 'react-native';
import type {
  OcrFailureType,
  OcrImageSource,
  OcrLineItemDraft,
  OcrParticipantDraft,
  OcrReceiptDraft,
  OcrReceiptSummary,
  OcrRecognitionResult,
} from '../types/paymentTypes';

// 정산 참여자가 없을 때를 대비한 최소한의 빈 리스트 반환 (하드코딩된 더미데이터 제거)
const buildEmptyParticipants = (): OcrParticipantDraft[] => [];
const buildEmptyItems = (): OcrLineItemDraft[] => [];

const buildEmptyDraft = (imageUri: string): OcrReceiptDraft => ({
  imageUri,
  storeName: '',
  paidAt: new Date(),
  totalAmount: 0,
  splitMode: 'TOTAL',
  participants: [],
  items: [],
});

const buildItemsUnreadableSummary = (imageUri: string): OcrReceiptSummary => ({
  imageUri,
  storeName: '인식된 정보 없음',
  paidAt: new Date(),
  totalAmount: 0,
});

export async function recognizeReceiptImage(
  roomId: number,
  imageUri: string,
  source: OcrImageSource,
): Promise<OcrRecognitionResult> {
  try {
    console.log('[OCR] Resizing image for upload...');
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1500 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. 백엔드 OCR 분석 호출 (Multipart/이미지 직접 전송 방식)
    console.log('[OCR] Forwarding binary to backend for analysis...');
    
    // 이전에는 S3 업로드 후 URL을 보냈으나, 이제는 로컬 리사이징 이미지를 직접 보냅니다.
    // S3 저장은 최종 결제 등록 시점에 수행하도록 변경되었습니다.
    const [ocrResponse, members] = await Promise.all([
      fetchOcrAnalysisMultipartApi(resized.uri),
      fetchExpenseParticipantsApi(roomId),
    ]);

    console.log('[OCR] Analysis & Member Fetch Success. Building draft...');
    
    console.log('[OCR] Backend Analysis Return Success:', ocrResponse);
    console.log('[OCR] Room Members Loaded:', members.length);

    const mappedItems = ocrResponse.items || [];
    
    // 참여자 목록 변환 (일단 전원 미선택 상태로 시작하거나, 전체 N빵 기본 로직에 맡김)
    const participants: OcrParticipantDraft[] = members.map(m => ({
        userId: m.userId,
        userName: m.userName,
        isSelected: false, // UI 진입 후 사용자가 직접 고르거나 ViewModel 기본값 활용
        isMe: false, // profileStore 연동 전이므로 false (UI에서 표시용)
        splitAmount: 0
    }));

    const draft: OcrReceiptDraft = {
      imageUri: resized.uri,
      storeName: ocrResponse.title || '알 수 없는 가맹점',
      paidAt: ocrResponse.paidAt ? new Date(ocrResponse.paidAt) : new Date(),
      totalAmount: ocrResponse.totalAmount || 0,
      splitMode: 'TOTAL',
      participants, 
      items: mappedItems.map((item, index) => ({
        itemId: index + 1,
        name: item.name || '알 수 없는 항목',
        unitPrice: item.totalAmount && item.quantity ? Math.floor(item.totalAmount / item.quantity) : (item.totalAmount || 0),
        quantity: item.quantity || 1,
        amount: item.totalAmount || 0,
        assignment: null,
      })),
    };

    return {
      kind: 'SUCCESS',
      draft,
    };
  } catch (error) {
    console.error('[OCR Recognition Exhaustive Error]:', error);
    return {
      kind: 'FAILURE',
      failureType: 'NETWORK_ERROR',
    };
  }
}

export async function getExistingOcrDraft(
  roomId: number,
  expenseId: number,
): Promise<OcrReceiptDraft> {
  // TODO: 실제 결제 상세 API(fetchExpenseDetailApi)와 연동하여 OCR 드래프트 구조로 변환하는 로직이 필요합니다.
  // 현재는 상세 페이지 진입 시 깨지지 않도록 최소한의 구조만 반환합니다.
  console.warn(`[OCR] getExistingOcrDraft logic for Expense ${expenseId} is not yet fully implemented with backend.`);
  
  return buildEmptyDraft('https://example.com/placeholder.jpg');
}

export async function getUnreadableReceiptFailure(
  roomId: number,
): Promise<OcrFailureType> {
  void roomId;
  return 'RECEIPT_UNREADABLE';
}

export async function getItemsUnreadableResult(
  roomId: number,
  imageUri: string,
): Promise<OcrRecognitionResult> {
  void roomId;
  return {
    kind: 'ITEMS_UNREADABLE',
    summary: buildItemsUnreadableSummary(imageUri),
  };
}
