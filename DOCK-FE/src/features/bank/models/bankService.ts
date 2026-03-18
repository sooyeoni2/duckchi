import { axiosClient } from '../../../core/network/axiosClient';
import type { RegisterBankAccountResult } from './bankTypes';

const MOCK_BANK_NAMES: Record<string, string> = {
  '001': '한국은행',
  '002': '산업은행',
  '003': '기업은행',
  '004': '국민은행',
  '011': '농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '시티은행',
  '032': '대구은행',
  '034': '광주은행',
  '035': '제주은행',
  '037': '전북은행',
  '039': '경남은행',
  '045': '새마을금고',
  '081': 'KEB하나은행',
  '088': '신한은행',
  '090': '카카오뱅크',
  '999': '싸피은행',
};

const USE_MOCK = true;

let mockPendingAccount: RegisterBankAccountResult | null = null;
let mockVerifyAttempts = 0;

export const registerBankAccount = async (
  bankCode: string,
  accountNo: string,
): Promise<RegisterBankAccountResult> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    const bankName = MOCK_BANK_NAMES[bankCode] ?? '알 수 없는 은행';
    const maskedAccountNo = accountNo.slice(0, 4) + '************';
    mockPendingAccount = { accountId: Date.now(), bankCode, bankName, maskedAccountNo };
    return mockPendingAccount;
  }
  const response = await axiosClient.post('/api/v1/auth/bank-accounts', { bankCode, accountNo });
  return response.data.data as RegisterBankAccountResult;
};

export const verify1Won = async (accountId: number, verificationCode: string): Promise<void> => {
  if (USE_MOCK) {
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    if (verificationCode !== '0000') {
      mockVerifyAttempts += 1;
      if (mockVerifyAttempts >= 3) {
        mockVerifyAttempts = 0;
        const err: any = new Error('LOCKED');
        err.response = { data: { errorcode: 'ACCOUNT-423-1' } };
        throw err;
      }
      const err: any = new Error('BAD_CODE');
      err.response = { data: { errorcode: 'ACCOUNT-400-3' } };
      throw err;
    }
    mockVerifyAttempts = 0;
    mockPendingAccount = null;
    return;
  }
  await axiosClient.post(`/api/v1/auth/bank-accounts/${accountId}/verify-1won`, {
    verificationCode,
  });
};
