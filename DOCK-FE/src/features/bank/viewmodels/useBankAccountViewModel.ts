import { useCallback, useState } from 'react';

import { registerBankAccount, verify1Won } from '../models/bankService';
import type { RegisterBankAccountResult } from '../models/bankTypes';

type RegisterError = 'BAD_REQUEST' | 'CONFLICT' | 'LOCKED' | 'SERVER_ERROR';
type VerifyError = 'BAD_CODE' | 'LOCKED' | 'ALREADY_VERIFIED' | 'BAD_GATEWAY' | 'SERVER_ERROR';

const parseErrorCode = (e: any): string =>
  e?.response?.data?.errorcode ?? e?.response?.data?.errorCode ?? '';

export const useBankAccountViewModel = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const register = useCallback(
    async (
      bankCode: string,
      accountNo: string,
    ): Promise<{ ok: true; result: RegisterBankAccountResult } | { ok: false; error: RegisterError }> => {
      setIsRegistering(true);
      try {
        const result = await registerBankAccount(bankCode, accountNo);
        return { ok: true, result };
      } catch (e: any) {
        const code = parseErrorCode(e);
        if (code === 'ACCOUNT-400-1') return { ok: false, error: 'BAD_REQUEST' };
        if (code === 'ACCOUNT-409-1') return { ok: false, error: 'CONFLICT' };
        if (code === 'ACCOUNT-423-1') return { ok: false, error: 'LOCKED' };
        return { ok: false, error: 'SERVER_ERROR' };
      } finally {
        setIsRegistering(false);
      }
    },
    [],
  );

  const verify = useCallback(
    async (
      accountId: number,
      verificationCode: string,
    ): Promise<{ ok: true } | { ok: false; error: VerifyError }> => {
      setIsVerifying(true);
      try {
        await verify1Won(accountId, verificationCode);
        return { ok: true };
      } catch (e: any) {
        const code = parseErrorCode(e);
        if (code === 'ACCOUNT-400-3') return { ok: false, error: 'BAD_CODE' };
        if (code === 'ACCOUNT-409-2') return { ok: false, error: 'ALREADY_VERIFIED' };
        if (code === 'ACCOUNT-423-1') return { ok: false, error: 'LOCKED' };
        if (code === 'ACCOUNT-502-1') return { ok: false, error: 'BAD_GATEWAY' };
        return { ok: false, error: 'SERVER_ERROR' };
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  return { register, verify, isRegistering, isVerifying };
};
