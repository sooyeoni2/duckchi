import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ProfileStackParamList } from '../../../../core/navigation/types';
import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { profileCardStyle } from '../profileCardStyle';
import { BadgeItem } from './BadgeItem';
import type { ProfileBadge } from '../../models/profileTypes';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface BadgePreviewCardProps {
  badges: ProfileBadge[];
}

export function BadgePreviewCard({ badges }: BadgePreviewCardProps) {
  const navigation = useNavigation<Nav>();
  const viewAllScale = React.useRef(new Animated.Value(1)).current;

  const handleViewAllPressIn = () => {
    Animated.spring(viewAllScale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handleViewAllPressOut = () => {
    Animated.spring(viewAllScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  const acquiredBadges = badges
    .filter(b => b.isAcquired)
    .sort((a, b) => {
      if (!b.acquiredAt) return -1;
      if (!a.acquiredAt) return 1;
      return b.acquiredAt.getTime() - a.acquiredAt.getTime();
    });
  const lockedBadges = badges.filter(b => !b.isAcquired);
  const displayBadges = [...acquiredBadges, ...lockedBadges].slice(0, 6);

  return (
    <View style={[profileCardStyle.card, styles.card]}>
      <View style={styles.header}>
        <Text style={profileCardStyle.cardLabel}>내 뱃지</Text>
        <Animated.View style={{ transform: [{ scale: viewAllScale }] }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('BadgeList')}
            onPressIn={handleViewAllPressIn}
            onPressOut={handleViewAllPressOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.viewAllText}>전체보기 &gt;</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={styles.grid}>
        {[0, 1].map(row => (
          <View key={row} style={styles.row}>
            {displayBadges.slice(row * 3, row * 3 + 3).map((badge) => (
              <BadgeItem
                key={badge.code}
                badge={badge}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  viewAllText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 10, color: AppColorStyles.textDisabled }),
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});
