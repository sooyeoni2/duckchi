import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle, PretendardTextStyle } from '@core/theme/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const s = SCREEN_WIDTH / 412;

export function RoomRankingTabScreen() {
  return (
    <View style={styles.placeholderContainer}>
      <View style={styles.placeholderCard}>
        <Text style={styles.sectionTitle}>순위</Text>
        <Text style={styles.placeholderDescription}>
          순위 화면은 모임 활동 규칙과 함께 연결될 예정입니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    paddingHorizontal: 21 * s,
    paddingTop: 20 * s,
  },
  placeholderCard: {
    borderRadius: 18 * s,
    backgroundColor: AppColorStyles.surface,
    paddingHorizontal: 16 * s,
    paddingVertical: 24 * s,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
  },
  sectionTitle: {
    marginBottom: 12 * s,
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16 * s,
      lineHeight: 16 * s,
      color: AppColorStyles.black,
    }),
  },
  placeholderDescription: {
    ...PretendardTextStyle.medium({
      fontSize: 13 * s,
      lineHeight: 20 * s,
      color: AppColorStyles.textSecondary,
    }),
  },
});
