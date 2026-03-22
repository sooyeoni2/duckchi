import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import { PretendardTextStyle } from '@core/theme/typography';
import type { ExpenseStatusFilter } from '../../models/paymentTypes';

interface PaymentStatusFilterBarProps {
  selectedStatus: ExpenseStatusFilter;
  onSelect: (status: ExpenseStatusFilter) => void;
}

/**
 * 화면 상단 상태 필터 옵션.
 * 실제 API 상태값과 FE 전용 ALL 옵션을 한 곳에 모아둔다.
 */
const FILTER_OPTIONS: Array<{ value: ExpenseStatusFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '정산 전' },
  { value: 'REQUESTED', label: '요청됨' },
  { value: 'SETTLED', label: '완료' },
];

/**
 * 상태 필터 버튼 묶음.
 * 선택 여부는 부모(Screen/ViewModel)에서 관리하고,
 * 이 컴포넌트는 "어떤 버튼을 눌렀는지"만 부모에 알려준다.
 */
export function PaymentStatusFilterBar({
  selectedStatus,
  onSelect,
}: PaymentStatusFilterBarProps) {
  return (
    <View style={styles.container}>
      {FILTER_OPTIONS.map((option) => {
        const isSelected = selectedStatus === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.8}
            style={[
              styles.filterButton,
              isSelected && styles.filterButtonSelected,
            ]}
          >
            <Text
              style={
                isSelected
                  ? PretendardTextStyle.semiBold({
                      fontSize: 13,
                      color: AppColorStyles.black,
                    })
                  : PretendardTextStyle.medium({
                      fontSize: 13,
                      color: AppColorStyles.textSecondary,
                    })
              }
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
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonSelected: {
    backgroundColor: AppColorStyles.yellow,
    borderColor: AppColorStyles.yellow,
  },
});
