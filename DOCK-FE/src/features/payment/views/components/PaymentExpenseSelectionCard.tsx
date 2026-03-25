import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import {
  formatExpenseListDate,
  formatExpenseTotalAmount,
  getExpensePrimaryDisplayDate,
} from '../../models/paymentDisplay';
import type { MyExpenseItem } from '../../models/paymentTypes';
import { PaymentExpenseStatusBadge } from './PaymentExpenseStatusBadge';

interface PaymentExpenseSelectionCardProps {
  expense: MyExpenseItem;
  selected: boolean;
  onToggle: () => void;
  onDetailPress: () => void;
}

export function PaymentExpenseSelectionCard({
  expense,
  selected,
  onToggle,
  onDetailPress,
}: PaymentExpenseSelectionCardProps) {
  const isPending = expense.status === 'PENDING';
  const isSettled = expense.status === 'SETTLED';
  const displayTime = formatExpenseListDate(
    getExpensePrimaryDisplayDate(expense),
  );
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        selected && styles.cardSelected,
        isSettled && styles.cardSettled,
        { transform: [{ scale }] },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.leadingSlot}>
          {isPending ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onToggle}
              style={styles.checkboxButton}
            >
              <MaterialDesignIcons
                name={selected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22}
                color={selected ? AppColorStyles.gray1 : AppColorStyles.gray2}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.leadingSpacer} />
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onDetailPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.contentButton}
        >
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                KBODiaGothicTextStyle.bold({
                  fontSize: 18,
                  color: isSettled
                    ? AppColorStyles.textSecondary
                    : AppColorStyles.black,
                }),
                styles.titleText,
              ]}
            >
              {expense.title}
            </Text>
            <PaymentExpenseStatusBadge status={expense.status} />
          </View>

          <View style={styles.metaRow}>
            <Text
              style={KBODiaGothicTextStyle.bold({
                fontSize: 16,
                color: isSettled ? AppColorStyles.gray2 : AppColorStyles.gray1,
              })}
            >
              {formatExpenseTotalAmount(expense.totalAmount)}
            </Text>
            <Text
              style={PretendardTextStyle.medium({
                fontSize: 13,
                color: isSettled
                  ? AppColorStyles.textHint
                  : AppColorStyles.textSecondary,
              })}
            >
              {displayTime}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 14,
    shadowColor: '#676767',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSettled: {
    backgroundColor: AppColorStyles.gray5,
    borderColor: AppColorStyles.border,
  },
  cardSelected: {
    backgroundColor: AppColorStyles.yellowLight,
    borderColor: AppColorStyles.yellow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leadingSlot: {
    width: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: 1,
  },
  checkboxButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadingSpacer: {
    width: 28,
    height: 28,
  },
  contentButton: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    flex: 1,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
});
