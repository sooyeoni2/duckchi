import * as ImagePicker from 'expo-image-picker';
import type { OcrImageSource } from './types/paymentTypes';

export interface PickedReceiptImage {
  uri: string;
  width: number;
  height: number;
  source: OcrImageSource;
}

async function ensurePermission(
  source: OcrImageSource,
): Promise<ImagePicker.PermissionStatus> {
  if (source === 'CAMERA') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    return permission.status;
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.status;
}

export async function pickReceiptImage(
  source: OcrImageSource,
): Promise<PickedReceiptImage | null> {
  const permissionStatus = await ensurePermission(source);

  if (permissionStatus !== 'granted') {
    throw new Error(
      source === 'CAMERA'
        ? '카메라 권한이 필요합니다.'
        : '사진 접근 권한이 필요합니다.',
    );
  }

  const result =
    source === 'CAMERA'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
          selectionLimit: 1,
        });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const [asset] = result.assets;

  return {
    uri: asset.uri,
    width: asset.width ?? 0,
    height: asset.height ?? 0,
    source,
  };
}
