import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { PaymentHeaderBar } from './components/PaymentHeaderBar';
import { PaymentTabContent } from './components/PaymentTabContent';
import {
  PaymentSectionTabs,
  type PaymentSectionTabKey,
} from './components/PaymentSectionTabs';

interface PaymentScreenProps {
  roomId?: number;
  roomName?: string;
}

/**
 * payment feature를 단독으로 검토할 때 쓰는 standalone screen.
 * 실제 room 내부 연결 시에는 PaymentTabContent만 재사용한다.
 */
export function PaymentScreen({
  roomId = 1,
  roomName = 'C102 회식',
}: PaymentScreenProps) {
  const [activeTab, setActiveTab] = React.useState<PaymentSectionTabKey>('payment');
  const [feedbackMessage, setFeedbackMessage] = React.useState<{
    title: string;
    description: string;
  } | null>(null);

  const renderPlaceholder = () => {
    const title = activeTab === 'settlement' ? '정산' : '순위';
    const description =
      activeTab === 'settlement'
        ? 'standalone payment 화면에서는 정산 탭을 room 내부 구조와 함께 붙일 예정입니다.'
        : '순위 탭은 모임 데이터 규칙이 정리된 뒤 연결합니다.';

    return (
      <View style={styles.placeholderContainer}>
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
              styles.placeholderMessage,
            ]}
          >
            {description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <PaymentHeaderBar
          title={roomName}
          onBackPress={() =>
            setFeedbackMessage({
              title: '뒤로가기 준비중',
              description: '모임 목록 화면 연결은 room shell과 함께 붙입니다.',
            })
          }
          onClosePress={() =>
            setFeedbackMessage({
              title: '종료하기',
              description: '모임 종료 플로우는 room 담당 구조에 맞춰 연결합니다.',
            })
          }
          onMorePress={() =>
            setFeedbackMessage({
              title: '더보기',
              description: '모임 설정/관리 메뉴는 room shell에서 연결합니다.',
            })
          }
        />

        <PaymentSectionTabs activeTab={activeTab} onChange={setActiveTab} />

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

        {activeTab === 'payment' ? (
          <PaymentTabContent roomId={roomId} />
        ) : (
          renderPlaceholder()
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
  placeholderContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  placeholderCard: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'center',
  },
  placeholderMessage: {
    marginTop: 10,
  },
});
