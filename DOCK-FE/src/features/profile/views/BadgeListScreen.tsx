import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BADGE_LOCKED_IMAGE } from '../../../core/constants/badgeImages';
import type { ProfileStackParamList } from '../../../core/navigation/types';
import { AppColorStyles } from '../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../core/theme/typography';
import { CustomAppBar } from '../../../shared/components/app_bar/CustomAppBar';
import { usePopOnTabBlur } from '../../../shared/hooks/usePopOnTabBlur';
import { useBadgeViewModel } from '../viewmodels/useBadgeViewModel';
import type { AcquiredBadge, LockedBadge } from '../models/profileTypes';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'BadgeList'>;

const BADGE_SIZE = 72;
const COLUMNS = 3;

function AcquiredBadgeItem({ badge }: { badge: AcquiredBadge }) {
  const imageSource = badge.imageUrl ? { uri: badge.imageUrl } : BADGE_LOCKED_IMAGE;
  return (
    <View style={styles.badgeItem}>
      <Image source={imageSource} style={styles.badgeImage} />
      <Text style={styles.badgeName}>{badge.name}</Text>
      <Text style={styles.badgeDesc}>{badge.description}</Text>
    </View>
  );
}

function LockedBadgeItem({ badge, onPress }: { badge: LockedBadge; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.badgeItem} onPress={onPress} activeOpacity={0.7}>
      <Image source={BADGE_LOCKED_IMAGE} style={[styles.badgeImage, styles.lockedImage]} />
      <Text style={[styles.badgeName, styles.lockedText]}>{badge.name}</Text>
      <Text style={styles.badgeProgress}>{badge.currentCount}/{badge.requiredCount}</Text>
    </TouchableOpacity>
  );
}

export function BadgeListScreen() {
  const navigation = useNavigation<Nav>();
  const { state, reload } = useBadgeViewModel();
  const [selectedBadge, setSelectedBadge] = useState<LockedBadge | null>(null);

  usePopOnTabBlur();

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={AppColorStyles.yellow} />
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity onPress={reload} style={styles.retryButton}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { acquiredBadges, lockedBadges } = state.data;
  const acquiredCount = acquiredBadges.length;
  const totalCount = acquiredCount + lockedBadges.length;
  const progress = totalCount > 0 ? acquiredCount / totalCount : 0;

  // 3열 그리드를 위해 행으로 분리
  const allItems: ({ type: 'acquired'; badge: AcquiredBadge } | { type: 'locked'; badge: LockedBadge })[] = [
    ...acquiredBadges.map(b => ({ type: 'acquired' as const, badge: b })),
    ...lockedBadges.map(b => ({ type: 'locked' as const, badge: b })),
  ];

  const rows: typeof allItems[] = [];
  for (let i = 0; i < allItems.length; i += COLUMNS) {
    rows.push(allItems.slice(i, i + COLUMNS));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CustomAppBar
        title="내 뱃지"
        centerTitle={false}
        onBackPress={() => navigation.goBack()}
        backgroundColor={AppColorStyles.background}
        showDivider
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>{acquiredCount}/{totalCount}개 획득</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>

        <View style={styles.grid}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map(item =>
                item.type === 'acquired'
                  ? <AcquiredBadgeItem key={item.badge.id} badge={item.badge} />
                  : <LockedBadgeItem key={item.badge.id} badge={item.badge} onPress={() => setSelectedBadge(item.badge)} />,
              )}
              {/* 마지막 행이 3개 미만이면 빈 칸 채우기 */}
              {row.length < COLUMNS &&
                Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.badgeItem} />
                ))
              }
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBadge(null)}>
          <View style={styles.modalBox}>
            <Image source={BADGE_LOCKED_IMAGE} style={[styles.modalImage, styles.lockedImage]} />
            <Text style={styles.modalName}>{selectedBadge?.name}</Text>
            <Text style={styles.modalDesc}>{selectedBadge?.description}</Text>
            <Text style={styles.modalProgress}>{selectedBadge?.currentCount} / {selectedBadge?.requiredCount}회 달성</Text>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColorStyles.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  progressCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressLabel: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textPrimary }),
    marginBottom: 10,
  },
  progressTrack: {
    height: 6,
    backgroundColor: AppColorStyles.gray4,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 3,
  },
  progressPercent: {
    ...KBODiaGothicTextStyle.light({ fontSize: 10, color: AppColorStyles.textDisabled }),
    marginTop: 4,
    textAlign: 'right',
  },
  grid: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: AppColorStyles.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeItem: {
    alignItems: 'center',
    width: BADGE_SIZE + 16,
    marginBottom: 8,
  },
  badgeImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  lockedImage: {
    opacity: 0.35,
  },
  badgeName: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12, color: AppColorStyles.textPrimary }),
    textAlign: 'center',
  },
  lockedText: {
    color: AppColorStyles.textDisabled,
  },
  badgeDesc: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12, color: AppColorStyles.textDisabled }),
    textAlign: 'center',
    marginTop: 2,
  },
  badgeProgress: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12, color: AppColorStyles.textDisabled }),
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: AppColorStyles.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: 260,
  },
  modalImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  modalName: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 16, color: AppColorStyles.textPrimary }),
    marginBottom: 8,
  },
  modalDesc: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.textHint }),
    textAlign: 'center',
    marginBottom: 8,
  },
  modalProgress: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 12, color: AppColorStyles.yellow }),
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.background,
  },
  errorText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.textHint }),
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: AppColorStyles.yellow,
    borderRadius: 8,
  },
  retryText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 14, color: AppColorStyles.black }),
  },
});
