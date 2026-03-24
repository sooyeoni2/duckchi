import { axiosClient } from '../../../core/network/axiosClient';

const USE_MOCK = false;

export const updateNotification = async (notificationEnabled: boolean): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return;
  }
  console.log('[updateNotification] calling API with:', notificationEnabled);
  await axiosClient.patch('/api/v1/users/notification', { notificationEnabled });
  console.log('[updateNotification] API success');
};
