import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppColorStyles } from '@core/theme/colors';
import { KBODiaGothicTextStyle } from '@core/theme/typography';

import type { HomeProfile } from '../../models/homeTypes';
import { hs } from './homeScale';

interface HomeHeaderSectionProps {
  profile: HomeProfile;
}

export function HomeHeaderSection({ profile }: HomeHeaderSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.brandText}>Duckchi</Text>
      <Text style={styles.catchCopy}>덕치와 함께 빠른 정산,{'\n'}기록은 착착!</Text>

      <View style={styles.profileRow}>
        {profile.profileImageUrl ? (
          <Image source={{ uri: profile.profileImageUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback} />
        )}
        <Text style={styles.greetingText}>
          {profile.name}
          <Text style={styles.tagText}>{profile.tag}</Text>님, 안녕하세요!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: hs(14),
  },
  brandText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: hs(24),
      lineHeight: hs(24),
      color: AppColorStyles.gray1,
    }),
  },
  catchCopy: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(26),
      lineHeight: hs(32),
      color: AppColorStyles.black,
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: hs(14),
    marginTop: hs(2),
  },
  avatarImage: {
    width: hs(52),
    height: hs(52),
    borderRadius: hs(26),
    backgroundColor: AppColorStyles.gray4,
  },
  avatarFallback: {
    width: hs(52),
    height: hs(52),
    borderRadius: hs(26),
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: AppColorStyles.gray3,
  },
  greetingText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(14),
      lineHeight: hs(24),
      color: AppColorStyles.black,
    }),
  },
  tagText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: hs(14),
      lineHeight: hs(24),
      color: AppColorStyles.gray2,
    }),
  },
});

