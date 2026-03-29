import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { OcrImageSource } from '../../../models/types/paymentTypes';
import { usePaymentOcrViewModel } from '../../../viewmodels/usePaymentOcrViewModel';
import { createExpense, updateExpense } from '../../../models/services/paymentService';
import { PaymentOcrAssignSheet } from './PaymentOcrAssignSheet';
import { PaymentOcrEditorView } from './PaymentOcrEditorView';
import { PaymentOcrEntryView } from './PaymentOcrEntryView';
import { PaymentOcrFailureView } from './PaymentOcrFailureView';
import { PaymentOcrMenuSplitView } from './PaymentOcrMenuSplitView';
import { PaymentOcrSplitSetupView } from './PaymentOcrSplitSetupView';
import { PaymentOcrPreviewView } from './PaymentOcrPreviewView';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

interface PaymentOcrFlowProps {
  roomId: number;
  mode: 'create' | 'edit';
  expenseId?: number;
  onOpenManualFallback: () => void;
  onFeedback: (title: string, description: string) => void;
  onClearFeedback: () => void;
  onComplete: (title: string, description: string) => void;
}

export interface PaymentOcrFlowHandle {
  canGoBack: () => boolean;
  goBack: () => void;
}

type OcrScene = 'entry' | 'preview' | 'failure' | 'editor' | 'splitSetup' | 'menuSplit';

function buildCompleteMessage(
  isEditMode: boolean,
  hasLineItems: boolean,
): { title: string; description: string } {
  if (isEditMode) {
    return {
      title: '수정 완료',
      description: hasLineItems
        ? '영수증 기반 정산안 수정 내용을 반영했습니다.'
        : '총 금액 중심 정산안 수정 내용을 반영했습니다.',
    };
  }

  return {
    title: '장바구니 담기 완료',
    description: hasLineItems
      ? '영수증 인식 결과를 정산안으로 담았습니다.'
      : '총 금액 중심 정산안을 장바구니에 담았습니다.',
  };
}

export const PaymentOcrFlow = React.forwardRef<
  PaymentOcrFlowHandle,
  PaymentOcrFlowProps
>(function PaymentOcrFlow(
  {
    roomId,
    mode,
    expenseId,
    onOpenManualFallback,
    onFeedback,
    onClearFeedback,
    onComplete,
  },
  ref,
) {
  const [sceneHistory, setSceneHistory] = React.useState<OcrScene[]>([
    mode === 'create' ? 'entry' : 'editor',
  ]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    state,
    draft,
    assignSheetState,
    selectedParticipants,
    selectedParticipantCount,
    perPersonAmount,
    remainingUnassignedAmount,
    assignTargetItem,
    resetState,
    scanReceipt,
    pickImage,
    recognizeImage,
    loadExistingDraft,
    fallbackToTotalOnly,
    fallbackToManualEditor,
    updateStoreName,
    updateTotalAmount,
    updateLineItemName,
    updateLineItemUnitPrice,
    updateLineItemQuantity,
    addLineItem,
    removeLineItem,
    setSplitMode,
    toggleParticipant,
    openAssignSheet,
    closeAssignSheet,
    setAssignMode,
    toggleAssignParticipant,
    updateAssignQuantity,
    confirmAssignSheet,
    clearItemAssignment,
  } = usePaymentOcrViewModel(roomId);

  React.useEffect(() => {
    const rootScene = mode === 'create' ? 'entry' : 'editor';
    setSceneHistory([rootScene]);
    onClearFeedback();

    if (mode === 'create') {
      resetState();
      return;
    }

    if (expenseId == null) {
      return;
    }

    void loadExistingDraft(expenseId);
  }, [
    expenseId,
    loadExistingDraft,
    mode,
    onClearFeedback,
    resetState,
    roomId,
  ]);

  const scene = sceneHistory[sceneHistory.length - 1];
  const canGoBack = sceneHistory.length > 1 && state.status !== 'processing';

  const pushScene = React.useCallback((nextScene: OcrScene) => {
    setSceneHistory((previousScenes) => {
      if (previousScenes[previousScenes.length - 1] === nextScene) {
        return previousScenes;
      }

      return [...previousScenes, nextScene];
    });
  }, []);

  const replaceHistory = React.useCallback((nextScenes: OcrScene[]) => {
    setSceneHistory(nextScenes);
  }, []);

  const goBack = React.useCallback(() => {
    if (state.status === 'processing') {
      return;
    }

    setSceneHistory((previousScenes) =>
      previousScenes.length > 1
        ? previousScenes.slice(0, previousScenes.length - 1)
        : previousScenes,
    );
    onClearFeedback();
  }, [onClearFeedback, state.status]);

  React.useImperativeHandle(
    ref,
    () => ({
      canGoBack: () => canGoBack,
      goBack,
    }),
    [canGoBack, goBack],
  );

  const handleScan = React.useCallback(
    async (source: OcrImageSource) => {
      onClearFeedback();
      const result = await pickImage(source);

      if (result === 'picked') {
        pushScene('preview');
      }
    },
    [onClearFeedback, pickImage, pushScene],
  );

  const handleConfirmPreview = React.useCallback(async () => {
    if (state.status !== 'preview') {
      return;
    }

    const { imageUri, source } = state;
    const result = await recognizeImage(imageUri, source);
    const rootScene: OcrScene = mode === 'create' ? 'entry' : 'editor';

    if (result === 'loaded') {
      replaceHistory([rootScene, 'editor']);
      return;
    }

    if (result === 'failed') {
      replaceHistory([rootScene, 'failure']);
    }
  }, [mode, recognizeImage, replaceHistory, state]);

  const handleEditorNext = React.useCallback(() => {
    if (draft == null) {
      return;
    }

    if (draft.items.length === 0) {
      onFeedback('항목 확인', 'OCR 항목을 하나 이상 확인하거나 추가해 주세요.');
      return;
    }

    if (draft.items.some((item: any) => item.name.trim().length === 0)) {
      onFeedback('메뉴명 확인', '비어 있는 메뉴명이 없도록 먼저 정리해 주세요.');
      return;
    }

    onClearFeedback();
    pushScene('splitSetup');
  }, [draft, onClearFeedback, onFeedback, pushScene]);

  const completeFlow = React.useCallback(async () => {
    if (draft == null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedParticipants = draft.participants.filter((p) => p.isSelected);
      const participantTotalSplits = new Map<number, number>();
      selectedParticipants.forEach((p) => participantTotalSplits.set(p.userId, 0));

      // draft -> API payload 변환
      const processedItems = draft.items.map((item) => {
        const assignment = item.assignment;
        let splits: any[] = [];

        if (assignment) {
          const { mode, participantUserIds, quantityAllocations } = assignment;
          
          if (mode === 'PERSON' || mode === 'EQUAL_SPLIT' || mode === 'MANUAL_SPLIT') {
            const count = participantUserIds.length;
            if (count > 0) {
              const base = Math.floor(item.amount / count);
              let remainder = item.amount % count;
              splits = participantUserIds.map((uid) => {
                const bonus = remainder > 0 ? 1 : 0;
                remainder--;
                return {
                  userId: uid,
                  splitAmount: base + bonus,
                  quantity: 1,
                };
              });
            }
          } else if (mode === 'QUANTITY' || mode === 'QUANTITY_SPLIT') {
            splits = (quantityAllocations ?? [])
              .filter((a) => a.quantity > 0)
              .map((a) => ({
                userId: a.userId,
                splitAmount: item.unitPrice * a.quantity,
                quantity: a.quantity,
              }));
          }
        } else {
          // 미지정 메뉴: 선택된 모든 참여자에게 N빵 적용 (폴백)
          const count = selectedParticipants.length;
          if (count > 0) {
            const base = Math.floor(item.amount / count);
            let remainder = item.amount % count;
            splits = selectedParticipants.map((p) => {
              const bonus = remainder > 0 ? 1 : 0;
              remainder--;
              return {
                userId: p.userId,
                splitAmount: base + bonus,
                quantity: 0,
              };
            });
          }
        }

        // 결과 누적
        splits.forEach((s) => {
          const current = participantTotalSplits.get(s.userId) || 0;
          participantTotalSplits.set(s.userId, current + s.splitAmount);
        });

        return {
          name: item.name,
          quantity: item.quantity,
          totalAmount: item.amount,
          splits,
        };
      });

      // 만약 세부 품목이 하나도 없는 경우 (전체 나누기 모드 등)는 기존 draft의 splitAmount를 그대로 사용
      const finalParticipants = draft.items.length === 0 
        ? selectedParticipants.map((p) => ({ userId: p.userId, splitAmount: p.splitAmount }))
        : selectedParticipants.map((p) => ({
            userId: p.userId,
            splitAmount: participantTotalSplits.get(p.userId) || 0,
          }));

      const payload: any = {
        roomSessionId: (draft as any).roomSessionId ?? 1,
        inputType: 'OCR' as const,
        title: draft.storeName || '영수증 결제',
        totalAmount: draft.totalAmount,
        paidAt: draft.paidAt instanceof Date ? new Date(draft.paidAt.getTime() - draft.paidAt.getTimezoneOffset() * 60000).toISOString().slice(0, -1) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, -1),
        items: processedItems,
        participants: finalParticipants,
        receiptImageUrl: draft.imageUri,
      };

      if (mode === 'edit' && expenseId != null) {
        await updateExpense(roomId, expenseId, payload);
      } else {
        await createExpense(roomId, payload);
      }

      const hasLineItems = draft.items.length > 0;
      const message = buildCompleteMessage(mode === 'edit', hasLineItems);
      onComplete(message.title, message.description);
    } catch (error) {
      onFeedback(
        '등록 실패',
        error instanceof Error ? error.message : '결제안 등록 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, expenseId, isSubmitting, mode, onComplete, onFeedback, roomId]);

  const handleSplitModeChange = React.useCallback(
    (nextMode: 'TOTAL' | 'ITEM') => {
      if (draft == null) {
        return;
      }

      if (nextMode === 'ITEM' && draft.items.length === 0) {
        onFeedback(
          '메뉴별 나누기 불가',
          '인식한 메뉴가 없어서 전체 N빵만 사용할 수 있어요.',
        );
        return;
      }

      onClearFeedback();
      setSplitMode(nextMode);
    },
    [draft, onClearFeedback, onFeedback, setSplitMode],
  );

  const handleSplitPrimaryAction = React.useCallback(() => {
    if (draft == null) {
      return;
    }

    if (selectedParticipantCount === 0) {
      onFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    if (draft.splitMode === 'TOTAL' || draft.items.length === 0) {
      completeFlow();
      return;
    }

    onClearFeedback();
    pushScene('menuSplit');
  }, [
    completeFlow,
    draft,
    onClearFeedback,
    onFeedback,
    pushScene,
    selectedParticipantCount,
  ]);

  const handleFailureFallback = React.useCallback(() => {
    if (state.status !== 'failure') {
      return;
    }

    if (state.failureType === 'RECEIPT_UNREADABLE') {
      onOpenManualFallback();
      return;
    }

    fallbackToManualEditor();
    pushScene('editor');
  }, [fallbackToManualEditor, onOpenManualFallback, pushScene, state]);

  const handleConfirmAssignSheet = React.useCallback(() => {
    const confirmed = confirmAssignSheet();

    if (!confirmed) {
      onFeedback(
        '메뉴 배정 확인',
        assignSheetState.status === 'open' && assignSheetState.mode === 'QUANTITY'
          ? '수량 합계가 메뉴 수량과 같아야 합니다.'
          : '참여자를 한 명 이상 선택해 주세요.',
      );
      return;
    }

    onClearFeedback();
  }, [assignSheetState, confirmAssignSheet, onClearFeedback, onFeedback]);

  const handleRetryExistingDraft = React.useCallback(() => {
    if (mode === 'edit' && expenseId != null) {
      void loadExistingDraft(expenseId);
      return;
    }

    resetState();
    replaceHistory(['entry']);
  }, [expenseId, loadExistingDraft, mode, replaceHistory, resetState]);

  const renderProcessingView = () => (
    <View style={styles.centerCard}>
      <ActivityIndicator size="small" color={AppColorStyles.black} />
      <Text style={styles.centerMessage}>영수증을 읽는 중입니다.</Text>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.centerCard}>
      <Text style={styles.errorTitle}>인식 흐름을 불러오지 못했어요</Text>
      <Text style={styles.centerMessage}>
        {state.status === 'error'
          ? state.message
          : '영수증 흐름을 다시 시작해 주세요.'}
      </Text>

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        onPress={onOpenManualFallback}
        style={styles.fallbackButton}
      >
        <Text style={styles.fallbackButtonText}>상세 메뉴 직접 입력</Text>
      </PaymentAnimatedTouchable>
    </View>
  );

  const renderContent = () => {
    if (state.status === 'processing') {
      return renderProcessingView();
    }

    if (state.status === 'error') {
      return renderErrorView();
    }

    if (scene === 'entry') {
      return (
        <PaymentOcrEntryView
          onPressCamera={() => {
            void handleScan('CAMERA');
          }}
          onPressLibrary={() => {
            void handleScan('LIBRARY');
          }}
        />
      );
    }

    if (scene === 'preview' && state.status === 'preview') {
      return (
        <PaymentOcrPreviewView
          imageUri={state.imageUri}
          onConfirm={() => {
            void handleConfirmPreview();
          }}
          onRetake={() => {
            goBack();
          }}
        />
      );
    }

    if (scene === 'failure' && state.status === 'failure') {
      return (
        <PaymentOcrFailureView
          failureType={state.failureType}
          summary={state.summary}
          onRetry={() => {
            void handleScan('CAMERA');
          }}
          onFallback={handleFailureFallback}
        />
      );
    }

    if (state.status !== 'loaded' || draft == null) {
      return renderProcessingView();
    }

    if (scene === 'editor') {
      return (
        <PaymentOcrEditorView
          draft={draft}
          onStoreNameChange={updateStoreName}
          onTotalAmountChange={updateTotalAmount}
          onItemNameChange={updateLineItemName}
          onItemUnitPriceChange={updateLineItemUnitPrice}
          onItemQuantityChange={updateLineItemQuantity}
          onAddItem={addLineItem}
          onRemoveItem={removeLineItem}
          onNext={handleEditorNext}
        />
      );
    }

    if (scene === 'splitSetup') {
      return (
        <PaymentOcrSplitSetupView
          draft={draft}
          itemSplitEnabled={draft.items.length > 0}
          selectedParticipantCount={selectedParticipantCount}
          perPersonAmount={perPersonAmount}
          onSelectSplitMode={handleSplitModeChange}
          onToggleParticipant={toggleParticipant}
          onPrimaryAction={handleSplitPrimaryAction}
        />
      );
    }

    return (
      <>
        <PaymentOcrMenuSplitView
          draft={draft}
          participants={selectedParticipants}
          remainingUnassignedAmount={remainingUnassignedAmount}
          onOpenAssignSheet={openAssignSheet}
          onClearAssignment={clearItemAssignment}
          onSubmit={completeFlow}
        />

        <PaymentOcrAssignSheet
          visible={assignSheetState.status === 'open' && assignTargetItem != null}
          itemName={assignTargetItem?.name ?? ''}
          itemQuantity={assignTargetItem?.quantity ?? 0}
          participants={selectedParticipants}
          mode={
            assignSheetState.status === 'open'
              ? assignSheetState.mode
              : 'PERSON'
          }
          selectedUserIds={
            assignSheetState.status === 'open'
              ? assignSheetState.participantUserIds
              : []
          }
          quantityAllocations={
            assignSheetState.status === 'open'
              ? assignSheetState.quantityAllocations
              : []
          }
          onSelectMode={setAssignMode}
          onToggleParticipant={toggleAssignParticipant}
          onUpdateQuantity={updateAssignQuantity}
          onClose={closeAssignSheet}
          onConfirm={handleConfirmAssignSheet}
        />
      </>
    );
  };

  return <View>{renderContent()}</View>;
});

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  centerMessage: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      lineHeight: 22,
      color: AppColorStyles.textSecondary,
    }),
    textAlign: 'center',
    marginTop: 10,
  },
  errorTitle: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  retryButton: {
    marginTop: 18,
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 18,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.black }),
  },
  fallbackButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  fallbackButtonText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.textSecondary }),
  },
});
