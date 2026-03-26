import React from 'react';
import {
  Dimensions,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { ExpenseInputType } from '../../../models/types/paymentTypes';
import { PAYMENT_ENTRY_TABS } from '../../../models/utils/paymentContentLayout';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;
const TAB_BORDER_WIDTH = Math.max(1, 1.5 * s);

interface PaymentEntryMethodTabsProps {
  activeTab: ExpenseInputType;
  onChange: (tab: ExpenseInputType) => void;
}

interface PaymentEntryMethodTabButtonProps {
  active: boolean;
  label: string;
  onPress: () => void;
  wrapperStyle?: StyleProp<ViewStyle>;
}

function PaymentEntryMethodTabButton({
  active,
  label,
  onPress,
  wrapperStyle,
}: PaymentEntryMethodTabButtonProps) {
  return (
    <PaymentAnimatedTouchable
      activeOpacity={0.85}
      onPress={onPress}
      wrapperStyle={[styles.tabButtonWrap, wrapperStyle]}
      style={[
        styles.tabButton,
        active ? styles.tabButtonActive : styles.tabButtonInactive,
      ]}
    >
      <Text
        style={KBODiaGothicTextStyle.bold({
          fontSize: 16 * s,
          color: active ? AppColorStyles.white : AppColorStyles.black,
        })}
      >
        {label}
      </Text>
    </PaymentAnimatedTouchable>
  );
}

export function PaymentEntryMethodTabs({
  activeTab,
  onChange,
}: PaymentEntryMethodTabsProps) {
  return (
    <View style={styles.container}>
      {PAYMENT_ENTRY_TABS.map((tab: any, index: any) => {
        const isActive = tab.key === activeTab;

        return (
          <PaymentEntryMethodTabButton
            key={tab.key}
            active={isActive}
            label={tab.label}
            onPress={() => onChange(tab.key)}
            wrapperStyle={
              index < PAYMENT_ENTRY_TABS.length - 1 ? styles.tabSpacing : undefined
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 21 * s,
    paddingTop: 16 * s,
    paddingBottom: 16 * s,
    backgroundColor: AppColorStyles.background,
  },
  tabButtonWrap: {
    flex: 1,
  },
  tabButton: {
    width: '100%',
    height: 62 * s,
    borderRadius: 14 * s,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4 * s,
  },
  tabButtonActive: {
    backgroundColor: AppColorStyles.gray1,
  },
  tabButtonInactive: {
    borderWidth: TAB_BORDER_WIDTH,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
    backgroundColor: AppColorStyles.white,
  },
  tabSpacing: {
    marginRight: 10 * s,
  },
});
