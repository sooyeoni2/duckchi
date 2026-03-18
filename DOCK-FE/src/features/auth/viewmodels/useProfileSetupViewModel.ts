import { useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setupProfile } from '../models/authService';
import { useAuthStore } from '../models/authStore';
import type { AuthStackParamList } from '@core/navigation/types';

type Navigation = NativeStackNavigationProp<AuthStackParamList, 'ProfileSetup'>;

export const useProfileSetupViewModel = (navigation: Navigation) => {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (profileImageKey: string) => {
    if (!user) {
      navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await setupProfile({
        name: user.name,
        profileImageKey,
      });
      // 업데이트된 유저 정보 저장
      setAuth(accessToken!, refreshToken!, {
        userId: result.userId,
        name: result.name,
        tag: result.tag,
        profileImageUrl: result.profileImageUrl,
      });
      navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
    } catch (e: any) {
      const status = e?.response?.status;
      // TODO: S3 구현 완료 후 500 예외 처리 제거
      if (status === 500) {
        navigation.getParent()?.navigate('BankAccountSetup', { returnTo: 'NewUser' });
        return;
      }
      const data = e?.response?.data;
      const message = data?.message ?? e?.message ?? '프로필 설정에 실패했습니다.';
      Alert.alert('오류', `${message}${status ? ` (HTTP ${status})` : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitting, submit };
};
