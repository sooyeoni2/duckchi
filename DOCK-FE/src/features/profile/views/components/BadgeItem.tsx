import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';


import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { BADGE_IMAGES, BADGE_LOCKED_IMAGE } from '../../../../core/constants/badgeImages';
import type { ProfileBadge } from '../../models/profileTypes';

interface BadgeItemProps {
  badge: ProfileBadge;
  /** 배지 슬롯 번호 (0~9) → duck1~duck10 이미지 결정 */
  badgeIndex: number;
}

const BADGE_SIZE = 80;

export const BadgeItem: React.FC<BadgeItemProps> = ({ badge, badgeIndex }) => {
  const imageSource = badge.isAcquired
    ? BADGE_IMAGES[badgeIndex % BADGE_IMAGES.length]
    : BADGE_LOCKED_IMAGE;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={[styles.image, !badge.isAcquired && { opacity: 0.4 }]} />
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
    marginBottom: 6,
  },
  image: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    resizeMode: 'contain',
  },
  name: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 11, color: AppColorStyles.textPrimary }),
    textAlign: 'center',
  },
  nameDisabled: {
    color: AppColorStyles.textDisabled,
  },
});
