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
import { PAYMENT_ENTRY_TABS } from '../../models/paymentContentLayout';
import type { PaymentListState } from '../../viewmodels/usePaymentListViewModel';
import type { ExpenseInputType, MyExpenseItem } from '../../models/paymentTypes';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';
import { PaymentExpenseGroupSection } from './PaymentExpenseGroupSection';
import { PaymentRequestActionButton } from './PaymentRequestActionButton';

interface PaymentOverviewViewProps {
  state: PaymentListState;
  pendingExpenses: MyExpenseItem[];
  requestedExpenses: MyExpenseItem[];
  settledExpenses: MyExpenseItem[];
  selectedExpenseIds: number[];
  onRefresh: () => void;
  onToggleExpense: (expenseId: number) => void;
  onOpenDetail: (expenseId: number) => void;
  onOpenEntry: (inputType: ExpenseInputType) => void;
  onRequestPress: () => void;
}

function renderLoadingCard(message: string) {
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
        {message}
      </Text>
    </View>
  );
}

export function PaymentOverviewView({
  state,
  pendingExpenses,
  requestedExpenses,
  settledExpenses,
  selectedExpenseIds,
  onRefresh,
  onToggleExpense,
  onOpenDetail,
  onOpenEntry,
  onRequestPress,
}: PaymentOverviewViewProps) {
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
          <PaymentAnimatedTouchable
            activeOpacity={0.85}
            onPress={onRefresh}
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

    if (state.status === 'empty') {
      return (
        <PaymentExpenseGroupSection
          title="정산 가능"
          caption="체크 후 요청할 수 있어요"
          expenses={[]}
          emptyMessage="등록된 결제 항목이 아직 없습니다."
          selectedExpenseIds={selectedExpenseIds}
          onToggleExpense={onToggleExpense}
          onOpenDetail={onOpenDetail}
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
          onToggleExpense={onToggleExpense}
          onOpenDetail={onOpenDetail}
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
            onToggleExpense={onToggleExpense}
            onOpenDetail={onOpenDetail}
          />
        )}

        {settledExpenses.length > 0 && (
          <PaymentExpenseGroupSection
            title="완료 내역"
            expenses={settledExpenses}
            emptyMessage=""
            selectedExpenseIds={selectedExpenseIds}
            onToggleExpense={onToggleExpense}
            onOpenDetail={onOpenDetail}
          />
        )}
      </>
    );
  };

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

        <View style={styles.listBody}>{renderOverviewListBody()}</View>

        <PaymentAnimatedTouchable
          activeOpacity={0.9}
          disabled={state.status !== 'loaded' || selectedExpenseIds.length === 0}
          onPress={onRequestPress}
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
        </PaymentAnimatedTouchable>
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
          {PAYMENT_ENTRY_TABS.map((action, index) => (
            <View
              key={action.key}
              style={[
                styles.actionButtonWrap,
                index < PAYMENT_ENTRY_TABS.length - 1 && styles.actionButtonSpacing,
              ]}
            >
              <PaymentRequestActionButton
                label={action.label}
                onPress={() => onOpenEntry(action.key)}
              />
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
