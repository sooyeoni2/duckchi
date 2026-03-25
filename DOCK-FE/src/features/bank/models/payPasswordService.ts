import { axiosClient } from '../../../core/network/axiosClient';

const USE_MOCK = false;

export const setPayPassword = async (password: string): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return;
  }
  await axiosClient.post('/api/v1/pay-password', { password });
};

export const verifyPayPassword = async (password: string): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    return;
  }
  await axiosClient.post('/api/v1/pay-password/vertify', { password });
};
