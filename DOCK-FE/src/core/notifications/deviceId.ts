import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = '@notifications/device-id';

const createFallbackDeviceId = (): string =>
  `device-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// 앱 설치 인스턴스 기준 식별자를 재사용해야 같은 기기 row를 안정적으로 갱신할 수 있다.
export const getOrCreateDeviceId = async (): Promise<string> => {
  const savedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (savedDeviceId) {
    return savedDeviceId;
  }

  const newDeviceId = createFallbackDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
  return newDeviceId;
};
