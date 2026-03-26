import { useCallback, useState } from 'react';

import { setPayPassword, verifyPayPassword } from '../models/payPasswordService';

type SetupError = 'ALREADY_SET' | 'SERVER_ERROR';
type VerifyError = 'NOT_SET' | 'WRONG_PASSWORD' | 'LOCKED' | 'SERVER_ERROR';

const parseErrorCode = (e: any): string =>
  e?.response?.data?.errorcode ?? e?.response?.data?.errorCode ?? '';

export const usePayPasswordViewModel = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const setup = useCallback(
    async (password: string): Promise<{ ok: true } | { ok: false; error: SetupError }> => {
      setIsSettingUp(true);
      try {
        await setPayPassword(password);
        return { ok: true };
      } catch (e: any) {
        const code = parseErrorCode(e);
        if (code === 'PAYPASS-409-1') return { ok: false, error: 'ALREADY_SET' };
        return { ok: false, error: 'SERVER_ERROR' };
      } finally {
        setIsSettingUp(false);
      }
    },
    [],
  );

  const verify = useCallback(
    async (password: string): Promise<{ ok: true } | { ok: false; error: VerifyError }> => {
      setIsVerifying(true);
      try {
        await verifyPayPassword(password);
        return { ok: true };
      } catch (e: any) {
        const code = parseErrorCode(e);
        if (code === 'PAY-404-1') return { ok: false, error: 'NOT_SET' };
        if (code === 'PAY-400-1') return { ok: false, error: 'WRONG_PASSWORD' };
        if (code === 'PAY-423-1') return { ok: false, error: 'LOCKED' };
        return { ok: false, error: 'SERVER_ERROR' };
      } finally {
        setIsVerifying(false);
      }
    },
    [],
  );

  return { setup, verify, isSettingUp, isVerifying };
};
