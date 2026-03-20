import { axiosClient } from '../../../core/network/axiosClient';

const USE_MOCK = true;

export const updateNotification = async (notificationEnabled: boolean): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    return;
  }
  await axiosClient.patch('/api/v1/users/notification', { notificationEnabled });
};
