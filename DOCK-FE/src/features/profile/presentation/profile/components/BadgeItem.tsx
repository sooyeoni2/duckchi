import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';

import { AppColorStyles } from '../../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../../core/theme/typography';
import type { ProfileBadgeEntity } from '../../../domain/profile/ProfileEntity';

interface BadgeItemProps {
  badge: ProfileBadgeEntity;
  /** acquired 뱃지 중 몇 번째인지 (플레이스홀더 색상 결정용) */
  acquiredIndex: number;
  /** 실제 배지 이미지 URI (추후 연동 시 전달) */
  imageUri?: string;
}

const ACQUIRED_COLORS = [
  '#FEEC7E',
  '#D980FF',
  '#FF9F3F',
  '#3FFF65',
];

const BADGE_SIZE = 60;

export const BadgeItem: React.FC<BadgeItemProps> = ({ badge, acquiredIndex, imageUri }) => {
  const placeholderColor = badge.isAcquired
    ? ACQUIRED_COLORS[acquiredIndex % ACQUIRED_COLORS.length]
    : AppColorStyles.gray4;

  return (
    <View style={styles.container}>
      <View style={[styles.imageWrapper, { backgroundColor: placeholderColor }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <MaterialDesignIcons
            name={badge.isAcquired ? 'star' : 'lock-outline'}
            size={28}
            color={badge.isAcquired ? AppColorStyles.white : AppColorStyles.gray2}
          />
        )}
        {!badge.isAcquired && <View style={styles.lockedOverlay} />}
      </View>
      <Text
        style={[styles.name, !badge.isAcquired && styles.nameDisabled]}
        numberOfLines={1}
      >
        {badge.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: BADGE_SIZE + 16,
    marginBottom: 8,
  },
  imageWrapper: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  image: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(242, 243, 245, 0.5)',
  },
  name: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 11, color: AppColorStyles.textPrimary }),
    textAlign: 'center',
  },
  nameDisabled: {
    color: AppColorStyles.textDisabled,
  },
});
