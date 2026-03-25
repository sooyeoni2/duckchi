import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  createProfileImageUploadUrl,
  setupProfile,
  uploadProfileImageToS3,
} from '../models/authService';
import { useAuthStore } from '../models/authStore';
import type { AuthStackParamList } from '@core/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

interface SelectedProfileImage {
  uri: string;
  fileName: string;
  contentType: string;
}

const inferImageContentType = (fileName: string): string => {
  const lowerCaseName = fileName.toLowerCase();
  if (lowerCaseName.endsWith('.png')) return 'image/png';
  if (lowerCaseName.endsWith('.webp')) return 'image/webp';
  if (lowerCaseName.endsWith('.heic')) return 'image/heic';
  if (lowerCaseName.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
};

export const useProfileSetupViewModel = (navigation: Navigation) => {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(user?.profileImageUrl ?? null);
  const [selectedImage, setSelectedImage] = useState<SelectedProfileImage | null>(null);

  const pickProfileImage = async () => {
    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('권한 필요', '프로필 이미지를 선택하려면 사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.fileName ?? asset.uri.split('/').pop() ?? 'profile-image.jpg';
      const contentType = asset.mimeType ?? inferImageContentType(fileName);

      setSelectedImage({
        uri: asset.uri,
        fileName,
        contentType,
      });
      setPreviewImageUri(asset.uri);
    } catch {
      Alert.alert('오류', '이미지를 불러오지 못했습니다. 다시 시도해주세요.');
    } finally {
      setPickingImage(false);
    }
  };

  const submit = async () => {
    if (!user || !accessToken || !refreshToken) {
      navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
      return;
    }

    setSubmitting(true);
    try {
      let profileImageKey: string | undefined;
      let profileImageUrl = previewImageUri ?? user.profileImageUrl;

      if (selectedImage) {
        const uploadInfo = await createProfileImageUploadUrl({
          fileName: selectedImage.fileName,
          contentType: selectedImage.contentType,
        });

        await uploadProfileImageToS3(
          uploadInfo.uploadUrl,
          selectedImage.uri,
          selectedImage.contentType,
        );

        profileImageKey = uploadInfo.key;
        profileImageUrl = uploadInfo.fileUrl;
      }

      const result = await setupProfile({
        name: user.name,
        profileImageKey,
      });

      setAuth(accessToken, refreshToken, {
        ...user,
        userId: result.userId,
        name: result.name,
        tag: result.tag,
        profileImageUrl: result.profileImageUrl ?? profileImageUrl,
      });

      navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const message = data?.msg ?? data?.message ?? error?.message ?? '프로필 설정에 실패했습니다.';
      Alert.alert('오류', `${message}${status ? ` (HTTP ${status})` : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    previewImageUri,
    pickingImage,
    submitting,
    pickProfileImage,
    submit,
  };
};
