import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OutlineButtonSmall } from '@shared/components';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { usePaymentListViewModel } from '../viewmodels/usePaymentListViewModel';
import { ExpenseHistoryCard } from './components/ExpenseHistoryCard';
import { PaymentFlowCard } from './components/PaymentFlowCard';
import { PaymentStatusFilterBar } from './components/PaymentStatusFilterBar';
import { PaymentSummaryCard } from './components/PaymentSummaryCard';

interface PaymentScreenProps {
  roomId?: number;
}

/**
 * 실제 상세 화면이 아직 없더라도,
 * "이 feature가 앞으로 어떤 입력 흐름을 품게 될지"를 먼저 보여주기 위한 설명 데이터.
 */
const INPUT_FLOWS = [
  {
    title: '계좌 내역 불러오기',
    description: 'PAY-01 계좌 거래 내역 조회 후 결제 등록으로 이어질 자리입니다.',
    accentColor: '#FEEC7E',
    iconName: 'bank-outline' as const,
  },
  {
    title: 'OCR 영수증 인식',
    description: 'OCR 인식 결과 수정과 메뉴 분배 화면으로 확장할 준비 구간입니다.',
    accentColor: '#DDF3FF',
    iconName: 'file-document-outline' as const,
  },
  {
    title: '직접 입력',
    description: '수기 결제 등록과 splitAmount 검증 흐름을 붙일 기본 진입점입니다.',
    accentColor: '#E8F5DF',
    iconName: 'pencil-outline' as const,
  },
];

/**
 * roomId 기준으로 내 결제 목록을 보여주는 메인 화면.
 * 아직 navigation 연결 전이라 props 기본값을 1로 두어 단독 확인도 가능하게 했다.
 */
export function PaymentScreen({ roomId = 1 }: PaymentScreenProps) {
  const { state, filteredExpenses, summary, loadExpenses, refresh, selectStatus } =
    usePaymentListViewModel(roomId);

  /**
   * 화면이 처음 열렸을 때 idle 상태라면 목록을 한 번 불러온다.
   * 실제 데이터 소스는 ViewModel이 결정하므로 Screen은 "언제 부를지"만 신경 쓴다.
   */
  useEffect(() => {
    if (state.status === 'idle') {
      void loadExpenses();
    }
  }, [loadExpenses, state.status]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.status === 'loading'}
            onRefresh={refresh}
            tintColor={AppColorStyles.black}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerChip}>
            <Text
              style={PretendardTextStyle.semiBold({
                fontSize: 12,
                color: AppColorStyles.black,
              })}
            >
              ROOM {roomId}
            </Text>
          </View>

          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 28,
              color: AppColorStyles.black,
            })}
          >
            내 결제
          </Text>
          <Text
            style={PretendardTextStyle.regular({
              fontSize: 15,
              lineHeight: 22,
              color: AppColorStyles.textSecondary,
            })}
          >
            `.ai` 기준으로 PAY-01, PAY-04, PAY-05 흐름을 붙이기 위한 room 기반 payment skeleton입니다.
          </Text>
        </View>

        {/* 로딩 중에는 사용자가 "아직 데이터 준비 중"이라는 걸 바로 알 수 있게 별도 카드로 보여준다. */}
        {(state.status === 'idle' || state.status === 'loading') && (
          <View style={styles.feedbackCard}>
            <ActivityIndicator size="small" color={AppColorStyles.black} />
            <Text
              style={[
                PretendardTextStyle.medium({
                  fontSize: 14,
                  color: AppColorStyles.textSecondary,
                }),
                styles.feedbackText,
              ]}
            >
              `/api/v1/rooms/{{roomId}}/expenses/me` 기준 목록을 준비 중입니다.
            </Text>
          </View>
        )}

        {/* 에러 처리와 재시도 버튼은 Screen 책임이다. */}
        {state.status === 'error' && (
          <View style={styles.feedbackCard}>
            <Text
              style={KBODiaGothicTextStyle.medium({
                fontSize: 16,
                color: AppColorStyles.black,
              })}
            >
              목록 로드 실패
            </Text>
            <Text
              style={[
                PretendardTextStyle.regular({
                  fontSize: 14,
                  lineHeight: 20,
                  color: AppColorStyles.textSecondary,
                }),
                styles.feedbackText,
              ]}
            >
              {state.message}
            </Text>
            <OutlineButtonSmall text="다시 불러오기" onPress={refresh} />
          </View>
        )}

        {/* 빈 목록은 loaded와 분리된 상태로 관리하므로, 조건이 훨씬 읽기 쉬워진다. */}
        {state.status === 'empty' && (
          <View style={styles.emptyCard}>
            <Text
              style={PretendardTextStyle.medium({
                fontSize: 14,
                color: AppColorStyles.textSecondary,
              })}
            >
              아직 등록된 내 결제가 없습니다.
            </Text>
          </View>
        )}

        {/* 실제 목록이 있을 때만 요약 카드와 리스트를 렌더링한다. */}
        {state.status === 'loaded' && (
          <>
            <PaymentSummaryCard {...summary} />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={KBODiaGothicTextStyle.medium({
                    fontSize: 18,
                    color: AppColorStyles.black,
                  })}
                >
                  입력 플로우
                </Text>
                <Text
                  style={PretendardTextStyle.medium({
                    fontSize: 12,
                    color: AppColorStyles.textSecondary,
                  })}
                >
                  ACCOUNT HISTORY / OCR / MANUAL
                </Text>
              </View>

              {INPUT_FLOWS.map((flow) => (
                <View key={flow.title} style={styles.flowCardWrap}>
                  <PaymentFlowCard {...flow} />
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={KBODiaGothicTextStyle.medium({
                    fontSize: 18,
                    color: AppColorStyles.black,
                  })}
                >
                  내 결제 목록
                </Text>
                <Text
                  style={PretendardTextStyle.medium({
                    fontSize: 12,
                    color: AppColorStyles.textSecondary,
                  })}
                >
                  {filteredExpenses.length}건
                </Text>
              </View>

              {/* 어떤 상태를 보고 싶은지 선택하면 ViewModel의 selectedStatus가 바뀐다. */}
              <PaymentStatusFilterBar
                selectedStatus={state.selectedStatus}
                onSelect={selectStatus}
              />

              {/* loaded 상태여도 필터 결과가 0건일 수 있으므로, 목록과는 별도로 한 번 더 empty를 처리한다. */}
              {filteredExpenses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text
                    style={PretendardTextStyle.medium({
                      fontSize: 14,
                      color: AppColorStyles.textSecondary,
                    })}
                  >
                    현재 상태 필터에 맞는 결제가 없습니다.
                  </Text>
                </View>
              ) : (
                filteredExpenses.map((expense) => (
                  <ExpenseHistoryCard key={expense.expenseId} expense={expense} />
                ))
              )}
            </View>
          </>
        )}

        {/* 공용 navigation을 아직 안 건드렸다는 사실을 화면 자체에도 남겨둔다. */}
        <View style={styles.noticeCard}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            보류 중인 연결 작업
          </Text>
          <Text
            style={PretendardTextStyle.regular({
              fontSize: 13,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            })}
          >
            실제 탭 노출과 room/payment navigation 연결은 기존 navigator 파일 수정이 필요하므로
            승인 전까지 추가하지 않았습니다.
          </Text>
        </View>
      </ScrollView>
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  headerChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: AppColorStyles.yellow,
    marginBottom: 12,
  },
  feedbackCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  feedbackText: {
    marginTop: 10,
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flowCardWrap: {
    marginBottom: 12,
  },
  emptyCard: {
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'center',
    marginBottom: 20,
  },
  noticeCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColorStyles.gray5,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
});
