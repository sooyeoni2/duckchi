import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';

interface PaymentFlowCardProps {
  title: string;
  description: string;
  accentColor: string;
  iconName: React.ComponentProps<typeof MaterialDesignIcons>['name'];
}

/**
 * 계좌내역 / OCR / 직접입력 같은 "아직 상세 화면이 붙지 않은 흐름"을 설명하는 카드.
 * skeleton 단계에서 사용자가 다음에 무엇이 들어올지를 이해하도록 돕는다.
 */
export function PaymentFlowCard({
  title,
  description,
  accentColor,
  iconName,
}: PaymentFlowCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>
        <MaterialDesignIcons name={iconName} size={20} color={AppColorStyles.black} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            {title}
          </Text>

          <View style={styles.badge}>
            <Text
              style={PretendardTextStyle.medium({
                fontSize: 11,
                color: AppColorStyles.black,
              })}
            >
              Skeleton
            </Text>
          </View>
        </View>

        <Text
          style={PretendardTextStyle.regular({
            fontSize: 13,
            lineHeight: 20,
            color: AppColorStyles.textSecondary,
          })}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: AppColorStyles.gray5,
  },
});
