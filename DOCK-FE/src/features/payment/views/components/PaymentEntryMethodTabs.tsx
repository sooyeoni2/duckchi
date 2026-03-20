import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { ExpenseInputType } from '../../models/paymentTypes';
import { PAYMENT_ENTRY_TABS } from '../../models/paymentContentLayout';

interface PaymentEntryMethodTabsProps {
  activeTab: ExpenseInputType;
  onChange: (tab: ExpenseInputType) => void;
}

export function PaymentEntryMethodTabs({
  activeTab,
  onChange,
}: PaymentEntryMethodTabsProps) {
  return (
    <View style={styles.container}>
      {PAYMENT_ENTRY_TABS.map((tab, index) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tabButton,
              isActive ? styles.tabButtonActive : styles.tabButtonInactive,
              index < PAYMENT_ENTRY_TABS.length - 1 && styles.tabSpacing,
            ]}
          >
            <Text
              style={KBODiaGothicTextStyle.bold({
                fontSize: 18,
                color: isActive ? AppColorStyles.white : AppColorStyles.black,
              })}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: AppColorStyles.background,
  },
  tabButton: {
    flex: 1,
    minHeight: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  tabButtonActive: {
    backgroundColor: AppColorStyles.gray1,
  },
  tabButtonInactive: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
    backgroundColor: AppColorStyles.white,
  },
  tabSpacing: {
    marginRight: 12,
  },
});
