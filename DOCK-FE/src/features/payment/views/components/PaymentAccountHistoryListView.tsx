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
import type { PaymentAccountHistoryState } from '../../viewmodels/usePaymentAccountHistoryViewModel';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';
import { PaymentAccountHistoryCard } from './PaymentAccountHistoryCard';

interface PaymentAccountHistoryListViewProps {
  state: PaymentAccountHistoryState;
  onRetry: () => void;
  onSelectHistory: (historyId: string) => void;
}

/**
 * 계좌 내역 mock 목록 화면.
 * 백엔드 응답 형식이 붙기 전까지는 거래 후보를 검토하고 등록 폼 진입 흐름만 먼저 확인한다.
 */
export function PaymentAccountHistoryListView({
  state,
  onRetry,
  onSelectHistory,
}: PaymentAccountHistoryListViewProps) {
  return (
    <View>
      <View style={styles.descriptionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          계좌 내역
        </Text>
        <Text
          style={[
            PretendardTextStyle.regular({
              fontSize: 14,
              lineHeight: 22,
              color: AppColorStyles.textSecondary,
            }),
            styles.descriptionText,
          ]}
        >
          거래 메모, 금액, 거래 시각을 먼저 보여주고 선택한 항목만 장바구니 등록 폼으로 넘깁니다.
        </Text>
      </View>

      {state.status === 'idle' || state.status === 'loading' ? (
        <View style={styles.centerCard}>
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
            계좌 거래 내역을 불러오는 중입니다.
          </Text>
        </View>
      ) : state.status === 'error' ? (
        <View style={styles.centerCard}>
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
            onPress={onRetry}
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
          </PaymentAnimatedTouchable>
        </View>
      ) : state.status === 'empty' ? (
        <View style={styles.centerCard}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              lineHeight: 20,
              color: AppColorStyles.textSecondary,
            })}
          >
            불러올 계좌 거래 내역이 없습니다.
          </Text>
        </View>
      ) : (
        state.histories.map((history) => (
          <PaymentAccountHistoryCard
            key={history.historyId}
            history={history}
            onAddToCart={() => {
              if (history.historyId) {
                onSelectHistory(history.historyId);
              }
            }}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  descriptionCard: {
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  descriptionText: {
    marginTop: 8,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
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
