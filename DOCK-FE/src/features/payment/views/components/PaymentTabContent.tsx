import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import {
  getExpenseDetail,
  getPaymentEntryPreview,
} from '../../models/paymentService';
import type {
  ExpenseInputType,
  MyExpenseDetail,
  MyExpenseItem,
} from '../../models/paymentTypes';
import { usePaymentAccountHistoryViewModel } from '../../viewmodels/usePaymentAccountHistoryViewModel';
import { usePaymentListViewModel } from '../../viewmodels/usePaymentListViewModel';
import { usePaymentManualEntryViewModel } from '../../viewmodels/usePaymentManualEntryViewModel';
import { PaymentAccountHistoryFormView } from './PaymentAccountHistoryFormView';
import { PaymentAccountHistoryListView } from './PaymentAccountHistoryListView';
import { PaymentAccountHistorySplitView } from './PaymentAccountHistorySplitView';
import { PaymentEntryPreviewScreen } from './PaymentEntryPreviewScreen';
import { PaymentExpenseDetailView } from './PaymentExpenseDetailView';
import { PaymentExpenseSelectionCard } from './PaymentExpenseSelectionCard';
import { PaymentManualEntrySetupView } from './PaymentManualEntrySetupView';
import { PaymentManualEntrySplitView } from './PaymentManualEntrySplitView';
import { PaymentRequestActionButton } from './PaymentRequestActionButton';

interface PaymentTabContentProps {
  roomId: number;
}

export interface PaymentTabContentHandle {
  canGoBack: () => boolean;
  goBack: () => void;
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
  | { kind: 'entry'; inputType: ExpenseInputType };

type PaymentDetailState =
  | { status: 'idle' }
  | { status: 'loading'; expenseId: number }
  | { status: 'loaded'; expenseId: number; detail: MyExpenseDetail }
  | { status: 'error'; expenseId: number; message: string };

const REQUEST_ACTIONS: Array<{
  key: ExpenseInputType;
  label: string;
}> = [
  { key: 'ACCOUNT_HISTORY', label: '계좌 내역' },
  { key: 'OCR', label: '영수증 스캔' },
  { key: 'MANUAL', label: '직접 입력' },
];

interface PaymentExpenseGroupSectionProps {
  title: string;
  caption?: string;
  expenses: MyExpenseItem[];
  emptyMessage: string;
  selectedExpenseIds: number[];
  onToggleExpense: (expenseId: number) => void;
  onOpenDetail: (expenseId: number) => void;
}

function PaymentExpenseGroupSection({
  title,
  caption,
  expenses,
  emptyMessage,
  selectedExpenseIds,
  onToggleExpense,
  onOpenDetail,
}: PaymentExpenseGroupSectionProps) {
  return (
    <View style={styles.groupSection}>
      <View style={styles.groupHeader}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
        >
          {title}
        </Text>
        {caption != null && (
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 12,
              color: AppColorStyles.textSecondary,
            })}
          >
            {caption}
          </Text>
        )}
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyGroupBox}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 13,
              color: AppColorStyles.textSecondary,
            })}
          >
            {emptyMessage}
          </Text>
        </View>
      ) : (
        expenses.map((expense) => (
          <PaymentExpenseSelectionCard
            key={expense.expenseId}
            expense={expense}
            selected={selectedExpenseIds.includes(expense.expenseId)}
            onToggle={() => onToggleExpense(expense.expenseId)}
            onDetailPress={() => onOpenDetail(expense.expenseId)}
          />
        ))
      )}
    </View>
  );
}

function getAccountHistoryIdFromExpenseId(expenseId: number): string {
  return `account-history-${expenseId}`;
}

export const PaymentTabContent = React.forwardRef<
  PaymentTabContentHandle,
  PaymentTabContentProps
>(function PaymentTabContent({ roomId }, ref) {
  const [scene, setScene] = React.useState<PaymentScene>({ kind: 'overview' });
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    React.useState<FeedbackMessage | null>(null);
  const [detailState, setDetailState] = React.useState<PaymentDetailState>({
    status: 'idle',
  });

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
    openDraft,
    updateItemName,
    toggleParticipant,
    prepareSplitStep,
    updateParticipantSplitAmount: updateAccountHistoryParticipantSplitAmount,
    resetDraft,
    selectedParticipantCount,
    splitAmountTotal: accountHistorySplitAmountTotal,
  } = usePaymentAccountHistoryViewModel(roomId);
  const {
    state: manualState,
    loadDraft: loadManualDraft,
    resetDraft: resetManualDraft,
    updateItemName: updateManualItemName,
    updateTotalAmount: updateManualTotalAmount,
    toggleParticipant: toggleManualParticipant,
    prepareSplitStep: prepareManualSplitStep,
    updateParticipantSplitAmount,
    selectedParticipantCount: manualSelectedParticipantCount,
    splitAmountTotal: manualSplitAmountTotal,
  } = usePaymentManualEntryViewModel(roomId);

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

    void getExpenseDetail(scene.expenseId)
      .then((detail) => {
        if (cancelled) {
          return;
        }

        setDetailState({
          status: 'loaded',
          expenseId: scene.expenseId,
          detail,
        });
      })
      .catch((error) => {
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
      (draftState.status === 'loaded' &&
        draftState.draft.historyId !== scene.historyId) ||
      (draftState.status === 'error' && draftState.historyId !== scene.historyId);

    if (shouldLoadDraft) {
      void openDraft(scene.historyId);
    }
  }, [draftState, openDraft, scene]);

  React.useEffect(() => {
    if (scene.kind === 'manualSetup' && manualState.status === 'idle') {
      void loadManualDraft();
    }
  }, [loadManualDraft, manualState.status, scene.kind]);

  const expenses = state.status === 'loaded' ? state.expenses : [];
  const pendingExpenses = React.useMemo(
    () => expenses.filter((expense) => expense.status === 'PENDING'),
    [expenses],
  );
  const requestedExpenses = React.useMemo(
    () => expenses.filter((expense) => expense.status === 'REQUESTED'),
    [expenses],
  );
  const settledExpenses = React.useMemo(
    () => expenses.filter((expense) => expense.status === 'SETTLED'),
    [expenses],
  );

  React.useEffect(() => {
    const pendingExpenseIds = pendingExpenses.map((expense) => expense.expenseId);

    setSelectedExpenseIds((previousIds) =>
      previousIds.filter((expenseId) => pendingExpenseIds.includes(expenseId)),
    );
  }, [pendingExpenses]);

  const selectedExpenseTitles = React.useMemo(
    () =>
      expenses
        .filter((expense) => selectedExpenseIds.includes(expense.expenseId))
        .map((expense) => expense.title),
    [expenses, selectedExpenseIds],
  );

  const showFeedback = React.useCallback((title: string, description: string) => {
    setFeedbackMessage({ title, description });
  }, []);

  const clearFeedback = React.useCallback(() => {
    setFeedbackMessage(null);
  }, []);

  const moveToOverview = React.useCallback(() => {
    clearFeedback();
    setScene({ kind: 'overview' });
  }, [clearFeedback]);

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

      setScene({ kind: 'entry', inputType });
    },
    [clearFeedback, resetDraft, resetManualDraft],
  );

  const handleOpenAccountHistoryDraft = React.useCallback(
    (historyId: string) => {
      clearFeedback();
      setScene({ kind: 'accountHistoryForm', historyId });
    },
    [clearFeedback],
  );

  const handleBackFromEntryFlow = React.useCallback(() => {
    clearFeedback();

    if (scene.kind === 'accountHistoryForm') {
      setScene({ kind: 'accountHistoryList' });
      return;
    }

    if (scene.kind === 'accountHistorySplit') {
      if (draftState.status === 'loaded') {
        setScene({
          kind: 'accountHistoryForm',
          historyId: draftState.draft.historyId,
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
  }, [clearFeedback, draftState, scene.kind]);

  React.useImperativeHandle(
    ref,
    () => ({
      canGoBack: () => scene.kind !== 'overview',
      goBack: () => {
        if (scene.kind === 'overview') {
          return;
        }

        clearFeedback();

        if (scene.kind === 'detail') {
          setScene({ kind: 'overview' });
          return;
        }

        if (scene.kind === 'accountHistoryForm') {
          setScene({ kind: 'accountHistoryList' });
          return;
        }

        if (scene.kind === 'accountHistorySplit') {
          if (draftState.status === 'loaded') {
            setScene({
              kind: 'accountHistoryForm',
              historyId: draftState.draft.historyId,
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
    }),
    [clearFeedback, draftState, scene.kind],
  );

  const handleAccountHistoryNext = React.useCallback(() => {
    if (draftState.status !== 'loaded') {
      return;
    }

    const selectedParticipants = draftState.draft.participants.filter(
      (participant) => participant.isSelected,
    );

    if (draftState.draft.itemName.trim().length === 0) {
      showFeedback('정산 제목 확인', '정산 제목을 먼저 입력해 주세요.');
      return;
    }

    if (selectedParticipants.length === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    const canMoveNext = prepareSplitStep();

    if (!canMoveNext) {
      showFeedback(
        '계좌 내역 확인',
        '계좌 내역 정보가 올바른지 다시 확인해 주세요.',
      );
      return;
    }

    clearFeedback();
    setScene({ kind: 'accountHistorySplit' });
  }, [clearFeedback, draftState, prepareSplitStep, showFeedback]);

  const handleAccountHistorySubmit = React.useCallback(() => {
    if (draftState.status !== 'loaded') {
      return;
    }

    const selectedParticipants = draftState.draft.participants.filter(
      (participant) => participant.isSelected,
    );

    if (selectedParticipants.length === 0) {
      showFeedback('참여자 설정 확인', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    if (accountHistorySplitAmountTotal !== draftState.draft.amount) {
      showFeedback(
        '금액 분배 확인',
        '전체 금액과 참여자별 금액 합계가 같아야 합니다.',
      );
      return;
    }

    showFeedback(
      '장바구니 담기 완료',
      `${draftState.draft.itemName} 항목을 계좌 내역 기반 정산으로 담았습니다.`,
    );
  }, [accountHistorySplitAmountTotal, draftState, showFeedback]);

  const handleManualNext = React.useCallback(() => {
    if (manualState.status !== 'loaded') {
      return;
    }

    if (manualState.draft.itemName.trim().length === 0) {
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

  const handleManualSubmit = React.useCallback(() => {
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

    showFeedback(
      '장바구니 담기 완료',
      `${manualState.draft.itemName} 항목을 직접 입력 정산으로 담았습니다.`,
    );
  }, [
    manualSelectedParticipantCount,
    manualSplitAmountTotal,
    manualState,
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
      resetManualDraft();
      setScene({ kind: 'manualSetup' });
      return;
    }

    setScene({ kind: 'entry', inputType: 'OCR' });
  }, [clearFeedback, detailState, resetManualDraft, showFeedback]);

  const handleCancelDetail = React.useCallback(() => {
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

    removeExpense(detailState.detail.expenseId);
    setScene({ kind: 'overview' });
    showFeedback(
      '삭제 완료',
      `${detailState.detail.title} 항목을 결제 목록에서 제거했습니다.`,
    );
  }, [detailState, removeExpense, showFeedback]);

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

  const activeEntryPreview =
    scene.kind === 'entry' ? getPaymentEntryPreview(scene.inputType) : null;

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

  const renderOverviewListBody = () => {
    if (state.status === 'idle' || state.status === 'loading') {
      return renderLoadingCard('내 결제 목록을 불러오는 중입니다.');
    }

    if (state.status === 'error') {
      return (
        <View style={styles.centerContent}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            })}
          >
            {state.message}
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={refresh}
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
          </TouchableOpacity>
        </View>
      );
    }

    if (state.status === 'empty') {
      return (
        <PaymentExpenseGroupSection
          title="정산 가능"
          caption="체크 후 요청할 수 있어요"
          expenses={[]}
          emptyMessage="등록된 결제 항목이 아직 없습니다."
          selectedExpenseIds={selectedExpenseIds}
          onToggleExpense={handleSelectExpense}
          onOpenDetail={handleOpenDetail}
        />
      );
    }

    return (
      <>
        <PaymentExpenseGroupSection
          title="정산 가능"
          caption="체크 후 요청할 수 있어요"
          expenses={pendingExpenses}
          emptyMessage="지금 요청 가능한 결제가 없습니다."
          selectedExpenseIds={selectedExpenseIds}
          onToggleExpense={handleSelectExpense}
          onOpenDetail={handleOpenDetail}
        />

        {(requestedExpenses.length > 0 || settledExpenses.length > 0) && (
          <View style={styles.historyDivider} />
        )}

        {requestedExpenses.length > 0 && (
          <PaymentExpenseGroupSection
            title="진행 중"
            expenses={requestedExpenses}
            emptyMessage=""
            selectedExpenseIds={selectedExpenseIds}
            onToggleExpense={handleSelectExpense}
            onOpenDetail={handleOpenDetail}
          />
        )}

        {settledExpenses.length > 0 && (
          <PaymentExpenseGroupSection
            title="완료 내역"
            expenses={settledExpenses}
            emptyMessage=""
            selectedExpenseIds={selectedExpenseIds}
            onToggleExpense={handleSelectExpense}
            onOpenDetail={handleOpenDetail}
          />
        )}
      </>
    );
  };

  const renderOverviewContent = () => (
    <>
      <View style={styles.listSection}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          내 결제 목록
        </Text>

        <View style={styles.listBody}>{renderOverviewListBody()}</View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={state.status !== 'loaded' || selectedExpenseIds.length === 0}
          onPress={handleRequestPress}
          style={[
            styles.primaryButton,
            (state.status !== 'loaded' || selectedExpenseIds.length === 0) &&
              styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 20,
              color: AppColorStyles.black,
            })}
          >
            요청하기
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionSection}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          정산 요청 추가
        </Text>
        <View style={styles.actionRow}>
          {REQUEST_ACTIONS.map((action, index) => (
            <View
              key={action.key}
              style={[
                styles.actionButtonWrap,
                index < REQUEST_ACTIONS.length - 1 && styles.actionButtonSpacing,
              ]}
            >
              <PaymentRequestActionButton
                label={action.label}
                onPress={() => handleOpenEntry(action.key)}
              />
            </View>
          ))}
        </View>
      </View>
    </>
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
          <TouchableOpacity
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
          </TouchableOpacity>
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

  const renderEntryPreviewContent = () => {
    if (activeEntryPreview == null) {
      return null;
    }

    return (
      <PaymentEntryPreviewScreen
        preview={activeEntryPreview}
        selectedExpenseTitles={selectedExpenseTitles}
        onBack={moveToOverview}
        onPrimaryAction={() =>
          showFeedback(
            activeEntryPreview.title,
            `${activeEntryPreview.primaryActionLabel} 흐름은 다음 단계에서 실제 폼으로 연결합니다.`,
          )
        }
      />
    );
  };

  const renderSceneFrame = (
    title: string,
    onBack: () => void,
    content: React.ReactNode,
  ) => (
    <View>
      <View style={styles.entryHeaderRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onBack}
          style={styles.entryBackButton}
        >
          <MaterialDesignIcons
            name="chevron-left"
            size={28}
            color={AppColorStyles.black}
          />
        </TouchableOpacity>

        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          {title}
        </Text>
      </View>

      {content}
    </View>
  );

  const renderSceneContent = () => {
    if (scene.kind === 'overview') {
      return renderOverviewContent();
    }

    if (scene.kind === 'detail') {
      return renderSceneFrame('상세 내역', moveToOverview, renderDetailContent());
    }

    if (scene.kind === 'accountHistoryList') {
      return renderSceneFrame(
        '정산 요청 추가',
        moveToOverview,
        <PaymentAccountHistoryListView
          state={historyState}
          onRetry={refreshHistories}
          onSelectHistory={handleOpenAccountHistoryDraft}
        />,
      );
    }

    if (scene.kind === 'accountHistoryForm') {
      return renderSceneFrame(
        '정산 요청 추가',
        handleBackFromEntryFlow,
        <PaymentAccountHistoryFormView
          draftState={draftState}
          selectedParticipantCount={selectedParticipantCount}
          onRetry={(historyId) => {
            void openDraft(historyId);
          }}
          onItemNameChange={updateItemName}
          onToggleParticipant={toggleParticipant}
          onNext={handleAccountHistoryNext}
        />,
      );
    }

    if (scene.kind === 'accountHistorySplit') {
      return renderSceneFrame(
        '정산 요청 추가',
        handleBackFromEntryFlow,
        <PaymentAccountHistorySplitView
          draftState={draftState}
          splitAmountTotal={accountHistorySplitAmountTotal}
          onRetry={(historyId) => {
            void openDraft(historyId);
          }}
          onParticipantAmountChange={updateAccountHistoryParticipantSplitAmount}
          onSubmit={handleAccountHistorySubmit}
        />,
      );
    }

    if (scene.kind === 'manualSetup') {
      return renderSceneFrame(
        '정산 요청 추가',
        handleBackFromEntryFlow,
        <PaymentManualEntrySetupView
          state={manualState}
          selectedParticipantCount={manualSelectedParticipantCount}
          onRetry={() => {
            void loadManualDraft();
          }}
          onItemNameChange={updateManualItemName}
          onTotalAmountChange={updateManualTotalAmount}
          onToggleParticipant={toggleManualParticipant}
          onNext={handleManualNext}
        />,
      );
    }

    if (scene.kind === 'manualSplit') {
      return renderSceneFrame(
        '정산 요청 추가',
        handleBackFromEntryFlow,
        <PaymentManualEntrySplitView
          state={manualState}
          splitAmountTotal={manualSplitAmountTotal}
          onRetry={() => {
            void loadManualDraft();
          }}
          onParticipantAmountChange={updateParticipantSplitAmount}
          onSubmit={handleManualSubmit}
        />,
      );
    }

    return renderSceneFrame(
      '정산 요청 추가',
      handleBackFromEntryFlow,
      renderEntryPreviewContent(),
    );
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
  listSection: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 24,
  },
  listBody: {
    marginTop: 16,
  },
  groupSection: {
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyGroupBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.gray5,
    marginBottom: 12,
  },
  historyDivider: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
    marginVertical: 6,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
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
  actionSection: {
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  actionButtonWrap: {
    flex: 1,
  },
  actionButtonSpacing: {
    marginRight: 12,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  entryBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 4,
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
