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
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { getExpenseDetail, getPaymentEntryPreview } from '../models/paymentService';
import type { ExpenseInputType, MyExpenseDetail } from '../models/paymentTypes';
import { usePaymentListViewModel } from '../viewmodels/usePaymentListViewModel';
import { PaymentExpenseDetailView } from './components/PaymentExpenseDetailView';
import { PaymentEntryPreviewScreen } from './components/PaymentEntryPreviewScreen';
import { PaymentHeaderBar } from './components/PaymentHeaderBar';
import { PaymentExpenseSelectionCard } from './components/PaymentExpenseSelectionCard';
import { PaymentRequestActionButton } from './components/PaymentRequestActionButton';
import {
  PaymentSectionTabs,
  type PaymentSectionTabKey,
} from './components/PaymentSectionTabs';

interface PaymentScreenProps {
  roomId?: number;
  roomName?: string;
}

interface FeedbackMessage {
  title: string;
  description: string;
}

type PaymentScene =
  | { kind: 'overview' }
  | { kind: 'detail'; expenseId: number }
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
    description: '계좌 거래 내역을 불러와 결제안에 추가하는 단계입니다.',
  },
  {
    key: 'OCR',
    label: '영수증 스캔',
    description: '영수증 인식 후 품목 분배를 붙일 예정입니다.',
  },
  {
    key: 'MANUAL',
    label: '직접 입력',
    description: '수기로 결제 정보를 등록하는 단계입니다.',
  },
];

/**
 * payment 담당 범위 안에서 먼저 완성할 모임방 내부 결제 화면.
 * room feature에 기대지 않고도 와이어프레임을 검증할 수 있게 payment 쪽에 둔다.
 */
export function PaymentScreen({
  roomId = 1,
  roomName = 'C102 회식',
}: PaymentScreenProps) {
  const [activeTab, setActiveTab] = React.useState<PaymentSectionTabKey>('payment');
  const [scene, setScene] = React.useState<PaymentScene>({ kind: 'overview' });
  const [selectedExpenseIds, setSelectedExpenseIds] = React.useState<number[]>([]);
  const [feedbackMessage, setFeedbackMessage] =
    React.useState<FeedbackMessage | null>(null);
  const [detailState, setDetailState] = React.useState<PaymentDetailState>({
    status: 'idle',
  });

  const { state, filteredExpenses, loadExpenses, refresh } =
    usePaymentListViewModel(roomId);

  /**
   * 결제 탭이 처음 열렸을 때만 mock 목록을 불러온다.
   * 실제 API 연결 전까지는 paymentService의 목 데이터를 그대로 사용한다.
   */
  React.useEffect(() => {
    if (activeTab === 'payment' && state.status === 'idle') {
      void loadExpenses();
    }
  }, [activeTab, loadExpenses, state.status]);

  /**
   * 목록이 바뀌면 현재 화면에서 선택 가능한 expense id만 남긴다.
   * 초기 진입 시에는 첫 번째 항목을 기본 선택해 CTA 동작을 빠르게 확인할 수 있게 한다.
   */
  React.useEffect(() => {
    if (activeTab !== 'payment' || state.status !== 'loaded') {
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
  }, [activeTab, filteredExpenses, state.status]);

  /**
   * 상세 화면 진입 시 mock detail을 비동기로 불러온다.
   * 실제 API가 붙어도 이 effect의 구조는 거의 유지할 수 있다.
   */
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

        const message =
          error instanceof Error
            ? error.message
            : '상세내역을 불러오지 못했습니다.';

        setDetailState({
          status: 'error',
          expenseId: scene.expenseId,
          message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [scene]);

  const showFeedback = (title: string, description: string) => {
    setFeedbackMessage({ title, description });
  };

  const clearFeedback = () => {
    setFeedbackMessage(null);
  };

  const handleHeaderBackPress = () => {
    if (scene.kind === 'overview') {
      showFeedback(
        '뒤로가기 준비중',
        '모임 목록 화면 연결은 room 담당 작업과 맞춰 붙입니다.',
      );
      return;
    }

    clearFeedback();
    setScene({ kind: 'overview' });
  };

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
    setScene({ kind: 'entry', inputType });
    showFeedback('입력 흐름 진입', description);
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

  const renderOverviewContent = () => {
    if (activeTab !== 'payment') {
      const title = activeTab === 'settlement' ? '정산' : '순위';
      const message =
        activeTab === 'settlement'
          ? '정산 탭은 결제 요청 흐름이 정리된 뒤 이어서 붙입니다.'
          : '순위 탭은 모임 데이터와 규칙이 정리된 뒤 붙입니다.';

      return (
        <View style={styles.placeholderCard}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            {title}
          </Text>
          <Text
            style={[
              PretendardTextStyle.regular({
                fontSize: 14,
                lineHeight: 22,
                color: AppColorStyles.textSecondary,
              }),
              styles.messageText,
            ]}
          >
            {message}
          </Text>
        </View>
      );
    }

    return (
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
  };

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

  const renderEntryContent = () => {
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
            `${activeEntryPreview.primaryActionLabel} 버튼까지 연결했습니다. 실제 입력 폼은 다음 단계에서 붙입니다.`,
          )
        }
      />
    );
  };

  const isRequestDisabled =
    scene.kind !== 'overview' ||
    activeTab !== 'payment' ||
    state.status !== 'loaded' ||
    selectedExpenseIds.length === 0;

  const shouldShowTabs = scene.kind === 'overview';
  const shouldShowFooter = scene.kind === 'overview' && activeTab === 'payment';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <PaymentHeaderBar
          title={roomName}
          onBackPress={handleHeaderBackPress}
          onClosePress={() =>
            showFeedback('종료하기', '모임 종료 플로우는 이후 payment/room 협업 단계에서 연결합니다.')
          }
          onMorePress={() =>
            showFeedback('더보기', '모임 설정/관리 메뉴는 room 담당자 구조에 맞춰 연결합니다.')
          }
        />

        {shouldShowTabs && (
          <PaymentSectionTabs activeTab={activeTab} onChange={setActiveTab} />
        )}

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
            shouldShowFooter ? (
              <RefreshControl
                refreshing={state.status === 'loading'}
                onRefresh={refresh}
                tintColor={AppColorStyles.black}
              />
            ) : undefined
          }
        >
          {scene.kind === 'overview'
            ? renderOverviewContent()
            : scene.kind === 'detail'
              ? renderDetailContent()
              : renderEntryContent()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
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
  placeholderCard: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'center',
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
