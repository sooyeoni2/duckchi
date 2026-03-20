import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';

interface PaymentHeaderBarProps {
  title: string;
  onBackPress: () => void;
  onClosePress: () => void;
  onMorePress: () => void;
}

/**
 * 모임방 내부 결제 화면 전용 상단 바.
 * room feature를 건드리지 않기 위해 payment 내부에 동일 역할의 헤더를 둔다.
 */
export function PaymentHeaderBar({
  title,
  onBackPress,
  onClosePress,
  onMorePress,
}: PaymentHeaderBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBackPress}
          style={styles.iconButton}
        >
          <MaterialDesignIcons
            name="chevron-left"
            size={28}
            color={AppColorStyles.black}
          />
        </TouchableOpacity>

        <Text
          numberOfLines={1}
          style={KBODiaGothicTextStyle.medium({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          {title}
        </Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onClosePress}
          style={styles.closeChip}
        >
          <Text
            style={PretendardTextStyle.semiBold({
              fontSize: 13,
              color: AppColorStyles.black,
            })}
          >
            종료하기
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onMorePress}
          style={styles.iconButton}
        >
          <MaterialDesignIcons
            name="dots-horizontal"
            size={24}
            color={AppColorStyles.black}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: AppColorStyles.background,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: AppColorStyles.yellow,
    marginRight: 12,
  },
});
