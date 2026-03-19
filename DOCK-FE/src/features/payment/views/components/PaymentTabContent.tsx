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
import type { ExpenseInputType, MyExpenseDetail } from '../../models/paymentTypes';
import { usePaymentAccountHistoryViewModel } from '../../viewmodels/usePaymentAccountHistoryViewModel';
import { usePaymentListViewModel } from '../../viewmodels/usePaymentListViewModel';
import { usePaymentManualEntryViewModel } from '../../viewmodels/usePaymentManualEntryViewModel';
import { PaymentAccountHistoryFormView } from './PaymentAccountHistoryFormView';
import { PaymentAccountHistoryListView } from './PaymentAccountHistoryListView';
import { PaymentEntryMethodSelector } from './PaymentEntryMethodSelector';
import { PaymentEntryPreviewScreen } from './PaymentEntryPreviewScreen';
import { PaymentExpenseDetailView } from './PaymentExpenseDetailView';
import { PaymentExpenseSelectionCard } from './PaymentExpenseSelectionCard';
import { PaymentManualEntrySetupView } from './PaymentManualEntrySetupView';
import { PaymentManualEntrySplitView } from './PaymentManualEntrySplitView';
import { PaymentRequestActionButton } from './PaymentRequestActionButton';

interface PaymentTabContentProps {
  roomId: number;
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
  description: string;
}> = [
  {
    key: 'ACCOUNT_HISTORY',
    label: '계좌 내역',
    description: '거래 내역을 골라 정산 요청 초안에 담는 흐름입니다.',
  },
  {
    key: 'OCR',
    label: '영수증 스캔',
    description: '영수증 인식 이후 품목을 나누는 목업 화면입니다.',
  },
  {
    key: 'MANUAL',
    label: '직접 입력',
    description: '항목명, 금액, 참여자를 직접 입력해 장바구니에 담는 흐름입니다.',
  },
];

/**
 * room 내부 "결제" 탭 본문만 담당하는 payment 전용 컨텐츠.
 * 방 shell은 room feature가 관리하고, payment는 내부 하위 flow만 가진다.
 */
export function PaymentTabContent({ roomId }: PaymentTabContentProps) {
  const [scene, setScene] = React.useState<PaymentScene>({ kind: 'overview' });
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    React.useState<FeedbackMessage | null>(null);
  const [detailState, setDetailState] = React.useState<PaymentDetailState>({
    status: 'idle',
  });

  const { state, filteredExpenses, loadExpenses, refresh } =
    usePaymentListViewModel(roomId);
  const {
    historyState,
    draftState,
    loadHistories,
    refreshHistories,
    openDraft,
    updateItemName,
    toggleParticipant,
    resetDraft,
    selectedParticipantCount,
  } = usePaymentAccountHistoryViewModel(roomId);
  const {
    state: manualState,
    loadDraft: loadManualDraft,
    resetDraft: resetManualDraft,
    updateItemName: updateManualItemName,
    updateTotalAmount: updateManualTotalAmount,
    toggleParticipant: toggleManualParticipant,
    prepareSplitStep,
    updateParticipantSplitAmount,
    selectedParticipantCount: manualSelectedParticipantCount,
    splitAmountTotal,
  } = usePaymentManualEntryViewModel(roomId);

  React.useEffect(() => {
    if (state.status === 'idle') {
      void loadExpenses();
    }
  }, [loadExpenses, state.status]);

  React.useEffect(() => {
    if (state.status !== 'loaded') {
      setSelectedExpenseIds([]);
      return;
    }

    setSelectedExpenseIds((previousIds) => {
      const availableIds = filteredExpenses.map((expense) => expense.expenseId);
      const remainingIds = previousIds.filter((expenseId) =>
        availableIds.includes(expenseId),
      );

      if (remainingIds.length > 0) {
        return remainingIds;
      }

      return availableIds.length > 0 ? [availableIds[0]] : [];
    });
  }, [filteredExpenses, state.status]);

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
              : '상세내역을 불러오지 못했습니다.',
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

  const showFeedback = React.useCallback((title: string, description: string) => {
    setFeedbackMessage({ title, description });
  }, []);

  const clearFeedback = React.useCallback(() => {
    setFeedbackMessage(null);
  }, []);

  const handleSelectExpense = (expenseId: number) => {
    clearFeedback();
    setSelectedExpenseIds((previousIds) =>
      previousIds.includes(expenseId)
        ? previousIds.filter((currentId) => currentId !== expenseId)
        : [...previousIds, expenseId],
    );
  };

  const handleOpenDetail = (expenseId: number) => {
    clearFeedback();
    setScene({ kind: 'detail', expenseId });
  };

  const handleOpenEntry = (inputType: ExpenseInputType, description: string) => {
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
    showFeedback('영수증 스캔 준비', description);
  };

  const handleSelectEntryMethod = (inputType: ExpenseInputType) => {
    clearFeedback();

    if (inputType === 'ACCOUNT_HISTORY') {
      setScene({ kind: 'accountHistoryList' });
      return;
    }

    if (inputType === 'MANUAL') {
      setScene({ kind: 'manualSetup' });
      return;
    }

    setScene({ kind: 'entry', inputType });
  };

  const handleOpenAccountHistoryDraft = (historyId: string) => {
    clearFeedback();
    setScene({ kind: 'accountHistoryForm', historyId });
  };

  const handleBackFromEntryFlow = () => {
    clearFeedback();

    if (scene.kind === 'accountHistoryForm') {
      setScene({ kind: 'accountHistoryList' });
      return;
    }

    if (scene.kind === 'manualSplit') {
      setScene({ kind: 'manualSetup' });
      return;
    }

    setScene({ kind: 'overview' });
  };

  const handleAccountHistoryNext = () => {
    if (draftState.status !== 'loaded') {
      return;
    }

    const selectedParticipants = draftState.draft.participants.filter(
      (participant) => participant.isSelected,
    );

    if (draftState.draft.itemName.trim().length === 0) {
      showFeedback('입력 확인 필요', '장바구니 항목명을 먼저 입력해 주세요.');
      return;
    }

    if (selectedParticipants.length === 0) {
      showFeedback('입력 확인 필요', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    showFeedback(
      '장바구니 저장 준비 완료',
      `${draftState.draft.itemName} 항목을 ${selectedParticipants.length}명 기준으로 정리했습니다.`,
    );
  };

  const handleManualNext = () => {
    if (manualState.status !== 'loaded') {
      return;
    }

    if (manualState.draft.itemName.trim().length === 0) {
      showFeedback('입력 확인 필요', '장바구니 항목명을 먼저 입력해 주세요.');
      return;
    }

    if (manualState.draft.totalAmount <= 0) {
      showFeedback('입력 확인 필요', '금액을 1원 이상 입력해 주세요.');
      return;
    }

    if (manualSelectedParticipantCount === 0) {
      showFeedback('입력 확인 필요', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    const canMoveNext = prepareSplitStep();

    if (!canMoveNext) {
      showFeedback('입력 확인 필요', '직접 입력 초안 상태를 다시 확인해 주세요.');
      return;
    }

    clearFeedback();
    setScene({ kind: 'manualSplit' });
  };

  const handleManualSubmit = () => {
    if (manualState.status !== 'loaded') {
      return;
    }

    if (manualSelectedParticipantCount === 0) {
      showFeedback('입력 확인 필요', '참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    if (splitAmountTotal !== manualState.draft.totalAmount) {
      showFeedback(
        '금액 확인 필요',
        '전체 금액과 참여자별 금액 합계가 같아야 장바구니에 담을 수 있습니다.',
      );
      return;
    }

    showFeedback(
      '장바구니 저장 완료',
      `${manualState.draft.itemName} 항목을 ${manualSelectedParticipantCount}명 기준으로 mock 장바구니에 담았습니다.`,
    );
  };

  const handleRequestPress = () => {
    if (selectedExpenseIds.length === 0) {
      showFeedback('선택 필요', '정산 요청할 결제를 하나 이상 선택해 주세요.');
      return;
    }

    showFeedback(
      '요청하기 준비 완료',
      `${selectedExpenseIds.length}건 선택 완료. 실제 요청 API 연결은 다음 단계에서 붙입니다.`,
    );
  };

  const selectedExpenseTitles =
    state.status === 'loaded'
      ? state.expenses
          .filter((expense) => selectedExpenseIds.includes(expense.expenseId))
          .map((expense) => expense.title)
      : [];

  const activeEntryPreview =
    scene.kind === 'entry' ? getPaymentEntryPreview(scene.inputType) : null;

  const activeEntryInputType =
    scene.kind === 'entry'
      ? scene.inputType
      : scene.kind === 'accountHistoryList' || scene.kind === 'accountHistoryForm'
        ? 'ACCOUNT_HISTORY'
        : scene.kind === 'manualSetup' || scene.kind === 'manualSplit'
          ? 'MANUAL'
          : null;

  const renderPaymentListBody = () => {
    if (state.status === 'idle' || state.status === 'loading') {
      return (
        <View style={styles.centerContent}>
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
            내 결제 목록을 불러오는 중입니다.
          </Text>
        </View>
      );
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
              다시 불러오기
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (state.status === 'empty') {
      return (
        <View style={styles.centerContent}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            })}
          >
            아직 등록된 내 결제가 없습니다.
          </Text>
        </View>
      );
    }

    return filteredExpenses.map((expense) => (
      <PaymentExpenseSelectionCard
        key={expense.expenseId}
        expense={expense}
        selected={selectedExpenseIds.includes(expense.expenseId)}
        onToggle={() => handleSelectExpense(expense.expenseId)}
        onDetailPress={() => handleOpenDetail(expense.expenseId)}
      />
    ));
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
        <View style={styles.listBody}>{renderPaymentListBody()}</View>
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
                onPress={() => handleOpenEntry(action.key, action.description)}
              />
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderDetailContent = () => {
    if (detailState.status === 'idle' || detailState.status === 'loading') {
      return (
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
            상세내역을 준비 중입니다.
          </Text>
        </View>
      );
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
              다시 불러오기
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <PaymentExpenseDetailView
        expense={detailState.detail}
        onBack={() => {
          clearFeedback();
          setScene({ kind: 'overview' });
        }}
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
        onBack={() => {
          clearFeedback();
          setScene({ kind: 'overview' });
        }}
        onPrimaryAction={() =>
          showFeedback(
            activeEntryPreview.title,
            `${activeEntryPreview.primaryActionLabel} 단계까지 연결했습니다. 실제 OCR 입력 폼은 다음 작업에서 붙입니다.`,
          )
        }
      />
    );
  };

  /**
   * 계좌 내역/직접 입력/OCR 같은 payment 내부 하위 흐름은
   * room shell 아래에서 한 단계 더 들어간 화면이라 로컬 header를 별도로 둔다.
   */
  const renderEntryFlowFrame = (
    content: React.ReactNode,
    options?: { showSelector?: boolean },
  ) => {
    const showSelector = options?.showSelector ?? true;

    return (
      <View>
        <View style={styles.entryHeaderRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleBackFromEntryFlow}
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
            정산 요청 추가
          </Text>
        </View>

        {showSelector && activeEntryInputType != null && (
          <PaymentEntryMethodSelector
            activeInputType={activeEntryInputType}
            onSelect={handleSelectEntryMethod}
          />
        )}

        {content}
      </View>
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
      return renderEntryFlowFrame(
        <PaymentAccountHistoryListView
          state={historyState}
          onRetry={refreshHistories}
          onSelectHistory={handleOpenAccountHistoryDraft}
        />,
      );
    }

    if (scene.kind === 'accountHistoryForm') {
      return renderEntryFlowFrame(
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

    if (scene.kind === 'manualSetup') {
      return renderEntryFlowFrame(
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
      return renderEntryFlowFrame(
        <PaymentManualEntrySplitView
          state={manualState}
          splitAmountTotal={splitAmountTotal}
          onRetry={() => {
            void loadManualDraft();
          }}
          onParticipantAmountChange={updateParticipantSplitAmount}
          onSubmit={handleManualSubmit}
        />,
        { showSelector: false },
      );
    }

    return renderEntryFlowFrame(renderEntryPreviewContent());
  };

  const shouldShowFooter = scene.kind === 'overview';
  const isRequestDisabled =
    state.status !== 'loaded' || selectedExpenseIds.length === 0;

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

      {shouldShowFooter && (
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={isRequestDisabled}
            onPress={handleRequestPress}
            style={[
              styles.requestButton,
              isRequestDisabled && styles.requestButtonDisabled,
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
      )}
    </View>
  );
}

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
  },
  entryBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginRight: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: AppColorStyles.background,
  },
  requestButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
  },
  requestButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
