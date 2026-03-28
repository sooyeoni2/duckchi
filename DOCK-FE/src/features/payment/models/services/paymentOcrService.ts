import * as ImageManipulator from 'expo-image-manipulator';
import { fetchOcrAnalysisMultipartApi, fetchExpenseParticipantsApi, fetchExpenseDetailApi } from '../api/paymentApi';
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

const buildItemsUnreadableSummary = (imageUri: string, participants: OcrParticipantDraft[]): OcrReceiptSummary => ({
  imageUri,
  storeName: '인식된 정보 없음',
  paidAt: new Date(),
  totalAmount: 0,
  participants,
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
        userTag: m.userTag,
        profileImageUrl: m.profileImageUrl,
        isSelected: false,
        isMe: false,
        splitAmount: 0
    }));

    const draft: OcrReceiptDraft = {
      imageUri: resized.uri,
      storeName: ocrResponse.title || '알 수 없는 가맹점',
      paidAt: ocrResponse.paidAt ? new Date(ocrResponse.paidAt) : new Date(),
      totalAmount: ocrResponse.totalAmount || 0,
      splitMode: 'TOTAL',
      participants, 
      items: (ocrResponse.items || []).map((item, index) => ({
        itemId: index + 1,
        name: item.name || '알 수 없는 항목',
        unitPrice: item.totalAmount && item.quantity ? Math.floor(item.totalAmount / item.quantity) : (item.totalAmount || 0),
        quantity: item.quantity || 1,
        amount: item.totalAmount || 0,
        assignment: null,
      })),
    };

    // 만약 아이템이 하나도 인식되지 않았다면 ITEMS_UNREADABLE로 처리
    if (draft.items.length === 0) {
        return {
            kind: 'ITEMS_UNREADABLE',
            summary: buildItemsUnreadableSummary(resized.uri, participants),
        };
    }

    return {
      kind: 'SUCCESS',
      draft,
    };
  } catch (error) {
    console.error('[OCR Recognition Exhaustive Error]:', error);
    // 실패하더라도 최소한 멤버 목록은 가져오려고 시도
    try {
        const members = await fetchExpenseParticipantsApi(roomId);
        const participants: OcrParticipantDraft[] = members.map(m => ({
            userId: m.userId,
            userName: m.userName,
            isSelected: false,
            isMe: false,
            splitAmount: 0
        }));
        return {
            kind: 'ITEMS_UNREADABLE',
            summary: buildItemsUnreadableSummary(imageUri, participants),
        };
    } catch {
        return {
            kind: 'FAILURE',
            failureType: 'NETWORK_ERROR',
        };
    }
  }
}

export async function getExistingOcrDraft(
  roomId: number,
  expenseId: number,
): Promise<OcrReceiptDraft> {
  const [detail, members] = await Promise.all([
    fetchExpenseDetailApi(roomId, expenseId),
    fetchExpenseParticipantsApi(roomId),
  ]);

  const participants: OcrParticipantDraft[] = members.map((m: any) => {
    const existing = detail.participants.find((p: any) => p.userId === m.userId);
    return {
      userId: m.userId,
      userName: m.userName,
      userTag: m.userTag,
      profileImageUrl: m.profileImageUrl,
      isSelected: !!existing,
      isMe: false,
      splitAmount: existing?.splitAmount || 0,
    };
  });

  return {
    imageUri: detail.paidAt || 'https://example.com/placeholder.jpg', // 실무에서는 receiptImageUrl 사용 필요
    storeName: detail.title,
    paidAt: detail.paidAt ? new Date(detail.paidAt) : new Date(),
    totalAmount: detail.totalAmount,
    splitMode: detail.items.length > 0 ? 'ITEM' : 'TOTAL',
    participants,
    items: detail.items.map((item: any, index: number) => ({
      itemId: index + 1,
      name: item.name,
      unitPrice: Math.floor(item.totalAmount / item.quantity),
      quantity: item.quantity,
      amount: item.totalAmount,
      assignment: {
        mode: 'PERSON',
        participantUserIds: item.itemParticipants.map((ip: any) => ip.userId),
        quantityAllocations: item.itemParticipants.map((ip: any) => ({
          userId: ip.userId,
          quantity: ip.quantity,
        })),
      },
    })),
  };
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
  participants: OcrParticipantDraft[],
): Promise<OcrRecognitionResult> {
  void roomId;
  return {
    kind: 'ITEMS_UNREADABLE',
    summary: buildItemsUnreadableSummary(imageUri, participants),
  };
}
