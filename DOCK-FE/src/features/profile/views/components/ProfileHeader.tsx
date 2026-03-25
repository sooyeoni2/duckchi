import React, { useState } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { AppColorStyles } from '../../../../core/theme/colors';
import { KBODiaGothicTextStyle } from '../../../../core/theme/typography';
import { createProfileImageUploadUrl, uploadProfileImageToS3 } from '../../../auth/models/authService';
import type { Profile } from '../../models/profileTypes';

interface ProfileHeaderProps {
  profile: Pick<Profile, 'name' | 'tag' | 'email' | 'profileImageUrl'>;
  onUpdateProfileImage: (profileImageKey: string) => Promise<void>;
}

export function ProfileHeader({ profile, onUpdateProfileImage }: ProfileHeaderProps) {
  const [tagWidth, setTagWidth] = useState(0);
  const imageScale = React.useRef(new Animated.Value(1)).current;

  const handleImagePressIn = () => {
    Animated.spring(imageScale, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handleImagePressOut = () => {
    Animated.spring(imageScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  };

  const handleImagePress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const contentType = asset.mimeType ?? 'image/jpeg';
    const fileName = asset.fileName ?? 'profile.jpg';

    try {
      const { uploadUrl, key } = await createProfileImageUploadUrl({ fileName, contentType });
      await uploadProfileImageToS3(uploadUrl, asset.uri, contentType);
      await onUpdateProfileImage(key);
    } catch {
      Alert.alert('오류', '프로필 이미지 변경에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: imageScale }] }}>
      <TouchableOpacity style={styles.imageWrapper} activeOpacity={0.8} onPress={handleImagePress} onPressIn={handleImagePressIn} onPressOut={handleImagePressOut}>
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
      </Animated.View>

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
