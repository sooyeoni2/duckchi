import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import type { Profile } from '../../models/profileTypes';

interface ProfileHeaderProps {
  profile: Pick<Profile, 'name' | 'tag' | 'email' | 'profileImageUrl'>;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [tagWidth, setTagWidth] = useState(0);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageWrapper} activeOpacity={0.8}>
        {profile.profileImageUrl ? (
          <Image source={{ uri: profile.profileImageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="person" size={60} color="#CCCCCC" />
          </View>
        )}
        <View style={styles.cameraButton}>
          <MaterialDesignIcons name="camera-outline" size={16} color={AppColorStyles.gray1} />
        </View>
      </TouchableOpacity>

      <View style={[styles.nameRow, { paddingLeft: tagWidth + 4 }]}>
        <Text style={styles.nameText}>{profile.name}</Text>
        <Text
          style={styles.tagText}
          numberOfLines={1}
          onLayout={e => setTagWidth(e.nativeEvent.layout.width)}
        >
          {profile.tag}
        </Text>
      </View>
      <Text style={styles.emailText}>{profile.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 16,
  },
  imageWrapper: {
    width: 126,
    height: 126,
    marginBottom: 12,
  },
  image: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },
  imagePlaceholder: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColorStyles.white,
    borderWidth: 0.5,
    borderColor: AppColorStyles.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 4,
  },
  nameText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 24, color: AppColorStyles.black }),
  },
  tagText: {
    paddingBottom: 3,
    ...KBODiaGothicTextStyle.medium({ fontSize: 11, color: AppColorStyles.textHint }),
  },
  emailText: {
    ...KBODiaGothicTextStyle.medium({ fontSize: 13, color: AppColorStyles.textHint }),
  },
});
