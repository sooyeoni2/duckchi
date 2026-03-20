import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';
import type { ExpenseInputType } from '../../models/paymentTypes';

interface PaymentEntryMethodSelectorProps {
  activeInputType: ExpenseInputType;
  onSelect: (inputType: ExpenseInputType) => void;
}

const ENTRY_METHOD_OPTIONS: Array<{
  key: ExpenseInputType;
  label: string;
}> = [
  { key: 'ACCOUNT_HISTORY', label: '계좌 내역' },
  { key: 'OCR', label: '영수증\n스캔' },
  { key: 'MANUAL', label: '직접 입력' },
];

/**
 * 정산 요청 추가 하위 플로우에서 입력 방식을 전환하는 전용 탭.
 * room 상단 탭과 역할이 다르므로 payment 내부 컴포넌트로 둔다.
 */
export function PaymentEntryMethodSelector({
  activeInputType,
  onSelect,
}: PaymentEntryMethodSelectorProps) {
  return (
    <View style={styles.row}>
      {ENTRY_METHOD_OPTIONS.map((option, index) => {
        const isActive = option.key === activeInputType;

        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.85}
            onPress={() => onSelect(option.key)}
            style={[
              styles.button,
              isActive ? styles.activeButton : styles.inactiveButton,
              index < ENTRY_METHOD_OPTIONS.length - 1 && styles.buttonSpacing,
            ]}
          >
            <Text
              style={KBODiaGothicTextStyle.bold({
                fontSize: 18,
                lineHeight: 28,
                color: isActive ? AppColorStyles.white : AppColorStyles.black,
              })}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    minHeight: 68,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  buttonSpacing: {
    marginRight: 12,
  },
  activeButton: {
    backgroundColor: AppColorStyles.gray1,
  },
  inactiveButton: {
    backgroundColor: AppColorStyles.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: AppColorStyles.black,
  },
});
