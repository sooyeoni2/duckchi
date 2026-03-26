import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

export type PaymentSectionTabKey = 'payment' | 'settlement' | 'ranking';

interface PaymentSectionTabsProps {
  activeTab: PaymentSectionTabKey;
  onChange: (tab: PaymentSectionTabKey) => void;
}

const PAYMENT_TABS: Array<{ key: PaymentSectionTabKey; label: string }> = [
  { key: 'payment', label: '결제' },
  { key: 'settlement', label: '정산' },
  { key: 'ranking', label: '순위' },
];

/**
 * 모임방 내부 탭 UI를 payment feature 내부에서 독립적으로 관리하기 위한 컴포넌트.
 * 현재는 결제 탭만 실구현하고, 나머지는 placeholder 탭으로 유지한다.
 */
export function PaymentSectionTabs({
  activeTab,
  onChange,
}: PaymentSectionTabsProps) {
  return (
    <View style={styles.container}>
      {PAYMENT_TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            onPress={() => onChange(tab.key)}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
          >
            <Text
              style={
                isActive
                  ? KBODiaGothicTextStyle.medium({
                      fontSize: 17,
                      color: AppColorStyles.black,
                    })
                  : KBODiaGothicTextStyle.medium({
                      fontSize: 17,
                      color: AppColorStyles.gray2,
                    })
              }
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColorStyles.background,
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.gray3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: AppColorStyles.black,
  },
});
