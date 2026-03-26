import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import {
  defaultPaymentContentLayoutState,
  type PaymentContentLayoutState,
} from '../../../models/utils/paymentContentLayout';
import { getExpenseDetail, createExpense, updateExpense, deleteExpense } from '../../../models/services/paymentService';
import type {
  ExpenseInputType,
  MyExpenseDetail,
} from '../../../models/types/paymentTypes';
import { usePaymentAccountHistoryViewModel } from '../../../viewmodels/usePaymentAccountHistoryViewModel';
import { usePaymentListViewModel } from '../../../viewmodels/usePaymentListViewModel';
import { usePaymentManualEntryViewModel } from '../../../viewmodels/usePaymentManualEntryViewModel';
import { PaymentAccountHistoryFormView } from '../history/PaymentAccountHistoryFormView';
import { PaymentAccountHistoryListView } from '../history/PaymentAccountHistoryListView';
import { PaymentAccountHistorySplitView } from '../history/PaymentAccountHistorySplitView';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';
import { PaymentExpenseDetailView } from '../detail/PaymentExpenseDetailView';
import { PaymentManualEntrySetupView } from '../manual/PaymentManualEntrySetupView';
import { PaymentManualEntrySplitView } from '../manual/PaymentManualEntrySplitView';
import { PaymentOcrFlow, PaymentOcrFlowHandle } from '../ocr/PaymentOcrFlow';
import { PaymentOverviewView } from '../common/PaymentOverviewView';

interface PaymentTabContentProps {
  roomId: number;
  onLayoutChange?: (layout: PaymentContentLayoutState) => void;
}

export interface PaymentTabContentHandle {
  canGoBack: () => boolean;
  goBack: () => void;
  selectEntryTab: (inputType: ExpenseInputType) => void;
}

interface FeedbackMessage {
  title: string;
  description: string;
}

type PaymentScene =
  | { kind: 'overview' }
  | { kind: 'detail'; expenseId: number }
  | { kind: 'accountHistoryList' }
  | { kind: 'accountHistoryForm'; historyId: string }
  | { kind: 'accountHistorySplit' }
  | { kind: 'manualSetup' }
  | { kind: 'manualSplit' }
  | {
      kind: 'ocr';
      mode: 'create' | 'edit';
      expenseId?: number;
      origin: 'overview' | 'detail';
    };

type PaymentDetailState =
  | { status: 'idle' }
  | { status: 'loading'; expenseId: number }
  | { status: 'loaded'; expenseId: number; detail: MyExpenseDetail }
  | { status: 'error'; expenseId: number; message: string };
function getAccountHistoryIdFromExpenseId(expenseId: number): string {
  return `account-history-${expenseId}`;
}

function buildLayoutState(scene: PaymentScene): PaymentContentLayoutState {
  if (scene.kind === 'overview') {
    return defaultPaymentContentLayoutState;
  }

  if (scene.kind === 'detail') {
    return {
      headerTitle: '상세 내역',
      topTabMode: 'NONE',
      activeEntryTab: null,
      showRoomActions: false,
    };
  }

  if (
    scene.kind === 'accountHistoryList' ||
    scene.kind === 'accountHistoryForm' ||
    scene.kind === 'accountHistorySplit'
  ) {
    return {
      headerTitle: '정산 요청 추가',
      topTabMode: 'ENTRY',
      activeEntryTab: 'ACCOUNT_HISTORY',
      showRoomActions: false,
    };
  }

  if (scene.kind === 'manualSetup' || scene.kind === 'manualSplit') {
    return {
      headerTitle: '정산 요청 추가',
      topTabMode: 'ENTRY',
      activeEntryTab: 'MANUAL',
      showRoomActions: false,
    };
  }

  return {
    headerTitle: '정산 요청 추가',
    topTabMode: 'ENTRY',
    activeEntryTab: 'OCR',
    showRoomActions: false,
  };
}

export const PaymentTabContent = React.forwardRef<
  PaymentTabContentHandle,
  PaymentTabContentProps
>(function PaymentTabContent({ roomId, onLayoutChange }, ref) {
  const [scene, setScene] = React.useState<PaymentScene>({ kind: 'overview' });
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    React.useState<FeedbackMessage | null>(null);
  const [detailState, setDetailState] = React.useState<PaymentDetailState>({
    status: 'idle',
  });
  const ocrFlowRef = React.useRef<PaymentOcrFlowHandle | null>(null);

  const {
    state,
    loadExpenses,
    refresh,
    markExpensesRequested,
    removeExpense,
  } = usePaymentListViewModel(roomId);
  const {
    historyState,
    draftState,
    loadHistories,
    refreshHistories,
    selectHistory,
    updateTitle: updateAccountHistoryTitle,
    toggleParticipant,
    splitEqually,
    updateAmount: updateAccountHistoryParticipantSplitAmount,
    resetDraft,
  } = usePaymentAccountHistoryViewModel(roomId);
  
  const accountHistorySelectedParticipantCount = draftState.status === 'editing' ? draftState.participants.filter((p: any) => p.isSelected).length : 0;
  const accountHistorySplitAmountTotal = draftState.status === 'editing' ? draftState.participants.reduce((s: number, p: any) => s + p.splitAmount, 0) : 0;

  const {
    state: manualState,
    loadDraft: loadManualDraft,
    resetDraft: resetManualDraft,
    loadDraftFromDetail: loadManualDraftFromDetail,
    updateTitle: updateManualTitle,
    updateTotalAmount: updateManualTotalAmount,
    toggleParticipant: toggleManualParticipant,
    prepareSplitStep: prepareManualSplitStep,
    updateParticipantSplitAmount: updateAmount,
  } = usePaymentManualEntryViewModel(roomId);
  
  const manualSelectedParticipantCount = manualState.status === 'loaded' ? manualState.draft.participants.filter((p: any)=>p.isSelected).length : 0;
  const manualSplitAmountTotal = manualState.status === 'loaded' ? manualState.draft.participants.reduce((s: number, p: any)=>s+p.splitAmount,0) : 0;

  React.useEffect(() => {
    if (state.status === 'idle') {
      void loadExpenses();
    }
  }, [loadExpenses, state.status]);

  React.useEffect(() => {
    if (scene.kind !== 'detail') {
      setDetailState({ status: 'idle' });
      return;
    }

    let cancelled = false;

    setDetailState({ status: 'loading', expenseId: scene.expenseId });

    void getExpenseDetail(scene.expenseId, roomId)
      .then((detail: any) => {
        if (cancelled) {
          return;
        }

        setDetailState({
          status: 'loaded',
          expenseId: scene.expenseId,
          detail,
        });
      })
      .catch((error: any) => {
        if (cancelled) {
          return;
        }

        setDetailState({
          status: 'error',
          expenseId: scene.expenseId,
          message:
            error instanceof Error
              ? error.message
              : '상세 내역을 불러오지 못했습니다.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [scene]);

  React.useEffect(() => {
    if (scene.kind === 'accountHistoryList' && historyState.status === 'idle') {
      void loadHistories();
    }
  }, [historyState.status, loadHistories, scene.kind]);

  React.useEffect(() => {
    if (scene.kind !== 'accountHistoryForm') {
      return;
    }

    const shouldLoadDraft =
      draftState.status === 'idle' ||
      (draftState.status === 'editing' &&
        draftState.historyId !== scene.historyId) ||
      (draftState.status === 'loading' && draftState.historyId !== scene.historyId);

    if (shouldLoadDraft) {
      void selectHistory(scene.historyId);
    }
  }, [draftState, selectHistory, scene]);

  React.useEffect(() => {
    if (scene.kind === 'manualSetup' && manualState.status === 'idle') {
      void loadManualDraft();
    }
  }, [loadManualDraft, manualState.status, scene.kind]);

  React.useEffect(() => {
    onLayoutChange?.(buildLayoutState(scene));
  }, [onLayoutChange, scene]);

  const expenses = React.useMemo(
    () => (state.status === 'loaded' ? state.expenses : []),
    [state],
  );
  const pendingExpenses = React.useMemo(
    () => expenses.filter((expense: any) => expense.status === 'PENDING'),
    [expenses],
  );
  const requestedExpenses = React.useMemo(
    () => expenses.filter((expense: any) => expense.status === 'REQUESTED'),
    [expenses],
  );
  const settledExpenses = React.useMemo(
    () => expenses.filter((expense: any) => expense.status === 'SETTLED'),
    [expenses],
  );

  React.useEffect(() => {
    const pendingExpenseIds = pendingExpenses.map((expense: any) => expense.expenseId);

    setSelectedExpenseIds((previousIds) =>
      previousIds.filter((expenseId) => pendingExpenseIds.includes(expenseId)),
    );
  }, [pendingExpenses]);

  const showFeedback = React.useCallback((title: string, description: string) => {
    setFeedbackMessage({ title, description });
  }, []);

  const clearFeedback = React.useCallback(() => {
    setFeedbackMessage(null);
  }, []);

  const openEntryScene = React.useCallback(
    (inputType: ExpenseInputType) => {
      clearFeedback();

      if (inputType === 'ACCOUNT_HISTORY') {
        resetDraft();
        setScene({ kind: 'accountHistoryList' });
        return;
      }

      if (inputType === 'MANUAL') {
        resetManualDraft();
        setScene({ kind: 'manualSetup' });
        return;
      }

      setScene({ kind: 'ocr', mode: 'create', origin: 'overview' });
    },
    [clearFeedback, resetDraft, resetManualDraft],
  );

  const handleSelectExpense = React.useCallback(
    (expenseId: number) => {
      clearFeedback();
      setSelectedExpenseIds((previousIds) =>
        previousIds.includes(expenseId)
          ? previousIds.filter((currentId) => currentId !== expenseId)
          : [...previousIds, expenseId],
      );
    },
    [clearFeedback],
  );

  const handleOpenDetail = React.useCallback(
    (expenseId: number) => {
      clearFeedback();
      setScene({ kind: 'detail', expenseId });
    },
    [clearFeedback],
  );

  const handleOpenEntry = React.useCallback(
    (inputType: ExpenseInputType) => {
      openEntryScene(inputType);
    },
    [openEntryScene],
  );

  const handleOpenAccountHistoryDraft = React.useCallback(
    (historyId: string) => {
      clearFeedback();
      setScene({ kind: 'accountHistoryForm', historyId });
    },
    [clearFeedback],
  );

  const handleOcrBack = React.useCallback(() => {
    clearFeedback();

    if (ocrFlowRef.current?.canGoBack()) {
      ocrFlowRef.current.goBack();
      return;
    }

    if (scene.kind === 'ocr' && scene.origin === 'detail' && scene.expenseId != null) {
      setScene({ kind: 'detail', expenseId: scene.expenseId });
      return;
    }

    setScene({ kind: 'overview' });
  }, [clearFeedback, scene]);

  const handleOcrComplete = React.useCallback(
    (title: string, description: string) => {
      refresh();
      setScene({ kind: 'overview' });
      showFeedback(title, description);
    },
    [refresh, showFeedback],
  );

  const handleOpenManualFallbackFromOcr = React.useCallback(() => {
    clearFeedback();
    resetManualDraft();
    setScene({ kind: 'manualSetup' });
  }, [clearFeedback, resetManualDraft]);

  React.useImperativeHandle(
    ref,
    () => ({
      canGoBack: () => scene.kind !== 'overview',
      goBack: () => {
        if (scene.kind === 'overview') {
          return;
        }

        clearFeedback();

        if (scene.kind === 'ocr') {
          handleOcrBack();
          return;
        }

        if (scene.kind === 'detail') {
          setScene({ kind: 'overview' });
          return;
        }

        if (scene.kind === 'accountHistoryForm') {
          setScene({ kind: 'accountHistoryList' });
          return;
        }

        if (scene.kind === 'accountHistorySplit') {
          if (draftState.status === 'editing') {
            setScene({
              kind: 'accountHistoryForm',
              historyId: draftState.historyId,
            });
            return;
          }

          setScene({ kind: 'accountHistoryList' });
          return;
        }

        if (scene.kind === 'manualSplit') {
          setScene({ kind: 'manualSetup' });
          return;
        }

        setScene({ kind: 'overview' });
      },
      selectEntryTab: (inputType: ExpenseInputType) => {
        openEntryScene(inputType);
      },
    }),
    [clearFeedback, draftState, handleOcrBack, openEntryScene, scene.kind],
  );

  const handleAccountHistoryNext = React.useCallback(() => {
    if (draftState.status !== 'editing') {
      return;
    }

    const selectedParticipants = draftState.participants.filter(
      (participant: any) => participant.isSelected,
    );

    if (draftState.title.trim().length === 0) {
      showFeedback('정산 제목 확인', '정산 제목을 먼저 입력해 주세요.');
      return;
    }

    if (selectedParticipants.length === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    const canMoveNext = splitEqually();
    // In usePaymentAccountHistoryViewModel, splitEqually returns void, and state update is internal.
    // So we assume success and move next.
    clearFeedback();
    setScene({ kind: 'accountHistorySplit' });
  }, [clearFeedback, draftState, splitEqually, showFeedback]);

  const handleAccountHistorySubmit = React.useCallback(async () => {
    if (draftState.status !== 'editing') {
      return;
    }

    const selectedParticipants = draftState.participants.filter(
      (participant: any) => participant.isSelected,
    );

    if (selectedParticipants.length === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    if (accountHistorySplitAmountTotal !== draftState.totalAmount) {
      showFeedback(
        '금액 분배 확인',
        '전체 금액과 참여자별 금액 합계가 같아야 합니다.',
      );
      return;
    }

    try {
      await createExpense(roomId, {
        roomSessionId: draftState.roomSessionId,
        inputType: 'ACCOUNT_HISTORY',
        title: draftState.title,
        totalAmount: draftState.totalAmount,
        paidAt: draftState.transactionAt || new Date().toISOString(),
        participants: selectedParticipants.map((p: any) => ({
          userId: p.userId,
          splitAmount: p.splitAmount,
        })),
      });

      refresh();
      setScene({ kind: 'overview' });
      showFeedback(
        '장바구니 담기 완료',
        `${draftState.title} 항목을 계좌 내역 기반 정산으로 담았습니다.`,
      );
    } catch (error) {
      showFeedback(
        '등록 실패',
        error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.',
      );
    }
  }, [accountHistorySplitAmountTotal, draftState, refresh, roomId, showFeedback]);

  const handleManualNext = React.useCallback(() => {
    if (manualState.status !== 'loaded') {
      return;
    }

    if (manualState.draft.title.trim().length === 0) {
      showFeedback('정산 제목 확인', '정산 제목을 먼저 입력해 주세요.');
      return;
    }

    if (manualState.draft.totalAmount <= 0) {
      showFeedback('금액 확인', '금액은 1원 이상 입력해 주세요.');
      return;
    }

    if (manualSelectedParticipantCount === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    const canMoveNext = prepareManualSplitStep();

    if (!canMoveNext) {
      showFeedback('금액 확인', '직접 입력 금액을 다시 확인해 주세요.');
      return;
    }

    clearFeedback();
    setScene({ kind: 'manualSplit' });
  }, [
    clearFeedback,
    manualSelectedParticipantCount,
    manualState,
    prepareManualSplitStep,
    showFeedback,
  ]);

  const handleManualSubmit = React.useCallback(async () => {
    if (manualState.status !== 'loaded') {
      return;
    }

    if (manualSelectedParticipantCount === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    if (manualSplitAmountTotal !== manualState.draft.totalAmount) {
      showFeedback(
        '금액 분배 확인',
        '전체 금액과 참여자별 금액 합계가 같아야 합니다.',
      );
      return;
    }

    try {
      const requestPayload = {
        roomSessionId: manualState.draft.roomSessionId,
        inputType: 'MANUAL' as const,
        title: manualState.draft.title,
        totalAmount: manualState.draft.totalAmount,
        paidAt: new Date().toISOString(),
        participants: manualState.draft.participants
          .filter((p: any) => p.isSelected)
          .map((p: any) => ({
            userId: p.userId,
            splitAmount: p.splitAmount,
          })),
      };

      if (manualState.draft.expenseId) {
        await updateExpense(roomId, manualState.draft.expenseId, requestPayload);
        showFeedback(
          '수정 완료',
          `${manualState.draft.title} 항목을 성공적으로 수정했습니다.`,
        );
      } else {
        await createExpense(roomId, requestPayload);
        showFeedback(
          '장바구니 담기 완료',
          `${manualState.draft.title} 항목을 직접 입력 정산으로 담았습니다.`,
        );
      }

      refresh();
      setScene({ kind: 'overview' });
    } catch (error) {
      showFeedback(
        '등록 실패',
        error instanceof Error ? error.message : '등록 중 오류가 발생했습니다.',
      );
    }
  }, [
    manualSelectedParticipantCount,
    manualSplitAmountTotal,
    manualState,
    refresh,
    roomId,
    showFeedback,
  ]);

  const handleEditDetail = React.useCallback(() => {
    if (detailState.status !== 'loaded') {
      return;
    }

    if (detailState.detail.status !== 'PENDING') {
      showFeedback(
        '수정 불가',
        '이미 정산 요청이 수행되었거나 완료된 항목은 수정할 수 없습니다.',
      );
      return;
    }

    clearFeedback();

    if (detailState.detail.inputType === 'ACCOUNT_HISTORY') {
      setScene({
        kind: 'accountHistoryForm',
        historyId: getAccountHistoryIdFromExpenseId(detailState.detail.expenseId),
      });
      return;
    }

    if (detailState.detail.inputType === 'MANUAL') {
      loadManualDraftFromDetail(detailState.detail);
      setScene({ kind: 'manualSetup' });
      return;
    }

    setScene({
      kind: 'ocr',
      mode: 'edit',
      expenseId: detailState.detail.expenseId,
      origin: 'detail',
    });
  }, [clearFeedback, detailState, resetManualDraft, showFeedback]);

  const handleCancelDetail = React.useCallback(async () => {
    if (detailState.status !== 'loaded') {
      return;
    }

    if (detailState.detail.status !== 'PENDING') {
      showFeedback(
        '취소 불가',
        '이미 정산 요청이 수행되었거나 완료된 항목은 취소할 수 없습니다.',
      );
      return;
    }

    try {
      await deleteExpense(roomId, detailState.detail.expenseId);
      refresh();
      setScene({ kind: 'overview' });
      showFeedback(
        '삭제 완료',
        `${detailState.detail.title} 항목을 결제 목록에서 제거했습니다.`,
      );
    } catch (error) {
      showFeedback(
        '삭제 실패',
        error instanceof Error ? error.message : '항목 삭제 중 오류가 발생했습니다.',
      );
    }
  }, [detailState, refresh, roomId, showFeedback]);

  const handleRequestPress = React.useCallback(() => {
    if (selectedExpenseIds.length === 0) {
      showFeedback(
        '요청 항목 확인',
        '정산 요청할 결제를 하나 이상 선택해 주세요.',
      );
      return;
    }

    markExpensesRequested(selectedExpenseIds);
    setSelectedExpenseIds([]);
    showFeedback(
      '정산 요청 완료',
      `${selectedExpenseIds.length}개의 항목을 요청된 상태로 변경했습니다.`,
    );
  }, [markExpensesRequested, selectedExpenseIds, showFeedback]);

  const renderLoadingCard = (message: string) => (
    <View style={styles.sceneCenterCard}>
      <ActivityIndicator size="small" color={AppColorStyles.black} />
      <Text
        style={[
          PretendardTextStyle.medium({
            fontSize: 13,
            lineHeight: 20,
            color: AppColorStyles.textSecondary,
          }),
          styles.messageText,
        ]}
      >
        {message}
      </Text>
    </View>
  );

  const renderOverviewContent = () => (
    <PaymentOverviewView
      state={state}
      pendingExpenses={pendingExpenses}
      requestedExpenses={requestedExpenses}
      settledExpenses={settledExpenses}
      selectedExpenseIds={selectedExpenseIds}
      onRefresh={refresh}
      onToggleExpense={handleSelectExpense}
      onOpenDetail={handleOpenDetail}
      onOpenEntry={handleOpenEntry}
      onRequestPress={handleRequestPress}
    />
  );

  const renderDetailContent = () => {
    if (detailState.status === 'idle' || detailState.status === 'loading') {
      return renderLoadingCard('상세 내역을 불러오는 중입니다.');
    }

    if (detailState.status === 'error') {
      return (
        <View style={styles.sceneCenterCard}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            })}
          >
            {detailState.message}
          </Text>
          <PaymentAnimatedTouchable
            activeOpacity={0.85}
            onPress={() => setScene({ kind: 'detail', expenseId: detailState.expenseId })}
            style={styles.retryButton}
          >
            <Text
              style={KBODiaGothicTextStyle.medium({
                fontSize: 14,
                color: AppColorStyles.black,
              })}
            >
              다시 시도하기
            </Text>
          </PaymentAnimatedTouchable>
        </View>
      );
    }

    return (
      <PaymentExpenseDetailView
        expense={detailState.detail}
        onEdit={handleEditDetail}
        onCancel={handleCancelDetail}
        editDisabled={detailState.detail.status !== 'PENDING'}
        cancelDisabled={detailState.detail.status !== 'PENDING'}
        actionHelperMessage={
          detailState.detail.status === 'PENDING'
            ? '정산 전 항목만 수정하거나 삭제할 수 있어요.'
            : '이미 정산 요청이 수행된 항목과 완료된 항목은 수정과 취소가 불가능해요.'
        }
      />
    );
  };

  const renderSceneContent = () => {
    if (scene.kind === 'overview') {
      return renderOverviewContent();
    }

    if (scene.kind === 'detail') {
      return renderDetailContent();
    }

    if (scene.kind === 'accountHistoryList') {
      return (
        <PaymentAccountHistoryListView
          state={historyState}
          onRetry={refreshHistories}
          onSelectHistory={handleOpenAccountHistoryDraft}
        />
      );
    }

    if (scene.kind === 'accountHistoryForm') {
      return (
        <PaymentAccountHistoryFormView
          draftState={draftState}
          selectedParticipantCount={accountHistorySelectedParticipantCount}
          onRetry={(historyId: any) => {
            void selectHistory(historyId);
          }}
          onItemNameChange={updateAccountHistoryTitle}
          onToggleParticipant={toggleParticipant}
          onNext={handleAccountHistoryNext}
        />
      );
    }

    if (scene.kind === 'accountHistorySplit') {
      return (
        <PaymentAccountHistorySplitView
          draftState={draftState}
          splitAmountTotal={accountHistorySplitAmountTotal}
          onRetry={(historyId: any) => {
            void selectHistory(historyId);
          }}
          onParticipantAmountChange={(userId: number, text: string) => updateAccountHistoryParticipantSplitAmount(userId, parseInt(text, 10) || 0)}
          onSubmit={handleAccountHistorySubmit}
        />
      );
    }

    if (scene.kind === 'manualSetup') {
      return (
        <PaymentManualEntrySetupView
          state={manualState}
          selectedParticipantCount={manualSelectedParticipantCount}
          onRetry={() => {
            void loadManualDraft();
          }}
          onItemNameChange={updateManualTitle}
          onTotalAmountChange={updateManualTotalAmount}
          onToggleParticipant={toggleManualParticipant}
          onNext={handleManualNext}
        />
      );
    }

    if (scene.kind === 'manualSplit') {
      return (
        <PaymentManualEntrySplitView
          state={manualState}
          splitAmountTotal={manualSplitAmountTotal}
          onRetry={() => {
            void loadManualDraft();
          }}
          onParticipantAmountChange={updateAmount}
          onSubmit={handleManualSubmit}
        />
      );
    }

    if (scene.kind === 'ocr') {
      return (
        <PaymentOcrFlow
          ref={ocrFlowRef}
          roomId={roomId}
          mode={scene.mode}
          expenseId={scene.expenseId}
          onOpenManualFallback={handleOpenManualFallbackFromOcr}
          onFeedback={showFeedback}
          onClearFeedback={clearFeedback}
          onComplete={handleOcrComplete}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {feedbackMessage != null && (
        <View style={styles.feedbackBanner}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 15,
              color: AppColorStyles.black,
            })}
          >
            {feedbackMessage.title}
          </Text>
          <Text
            style={[
              PretendardTextStyle.regular({
                fontSize: 13,
                lineHeight: 20,
                color: AppColorStyles.textSecondary,
              }),
              styles.feedbackDescription,
            ]}
          >
            {feedbackMessage.description}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          scene.kind === 'overview' ? (
            <RefreshControl
              refreshing={state.status === 'loading'}
              onRefresh={refresh}
              tintColor={AppColorStyles.black}
            />
          ) : scene.kind === 'accountHistoryList' ? (
            <RefreshControl
              refreshing={historyState.status === 'loading'}
              onRefresh={refreshHistories}
              tintColor={AppColorStyles.black}
            />
          ) : undefined
        }
      >
        {renderSceneContent()}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  feedbackBanner: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: AppColorStyles.yellowLight,
    borderWidth: 1,
    borderColor: AppColorStyles.yellow,
  },
  feedbackDescription: {
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sceneCenterCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  messageText: {
    marginTop: 10,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: AppColorStyles.yellow,
  },
});
