import { useState, useCallback, useEffect } from 'react';
import { getAccountHistories } from '../models/paymentService';
import { AccountHistoryItem } from '../models/paymentTypes';

/**
 * 🏦 계좌 거래 내역 조회 및 선택 로직을 담당하는 ViewModel
 */
export const useAccountHistoryViewModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [histories, setHistories] = useState<AccountHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🔄 거래 내역 불러오기
   */
  const loadHistories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAccountHistories();
      setHistories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '내역을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  return {
    isLoading,
    histories,
    error,
    refresh: loadHistories,
  };
};
