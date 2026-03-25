import { useCallback, useEffect, useMemo, useState } from 'react';

import { HOME_DASHBOARD_MOCK } from '../models/homeMockData';
import {
  areAllRoomsAutoDebitAgreed,
  fetchHomeDashboard,
  transferPendingSettlements,
} from '../models/homeService';
import type { HomeDashboardState, HomeTransferAction } from '../models/homeTypes';

export const useHomeViewModel = () => {
  const [state, setState] = useState<HomeDashboardState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const applyDashboardData = useCallback(async () => {
    const result = await fetchHomeDashboard();
    setState({
      status: 'loaded',
      data: result.data,
      fallbackSections: result.fallbackSections,
    });
  }, []);

  const reload = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      await applyDashboardData();
    } catch (error) {
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : '홈 정보를 불러오지 못했습니다.',
        data: HOME_DASHBOARD_MOCK,
      });
    }
  }, [applyDashboardData]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await applyDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  }, [applyDashboardData]);

  const loadedData = useMemo(
    () => (state.status === 'loaded' ? state.data : null),
    [state],
  );

  const transferSingle = useCallback(
    async (settlementId: number) => {
      setIsTransferring(true);
      try {
        await transferPendingSettlements([settlementId]);
        await refresh();
      } finally {
        setIsTransferring(false);
      }
    },
    [refresh],
  );

  const transferAllPending = useCallback(async () => {
    if (loadedData == null) {
      return;
    }

    const settlementIds = loadedData.pendingSettlements.map(
      (item) => item.settlementId,
    );

    if (settlementIds.length === 0) {
      return;
    }

    setIsTransferring(true);
    try {
      await transferPendingSettlements(settlementIds);
      await refresh();
    } finally {
      setIsTransferring(false);
    }
  }, [loadedData, refresh]);

  const isAutoTransferEnabled = useCallback(
    async (action: HomeTransferAction): Promise<boolean> => {
      if (action.type === 'single') {
        if (action.roomId == null) {
          return false;
        }
        return areAllRoomsAutoDebitAgreed([action.roomId]);
      }

      if (loadedData == null) {
        return false;
      }

      const roomIds = loadedData.pendingSettlements.map((item) => item.roomId);
      return areAllRoomsAutoDebitAgreed(roomIds);
    },
    [loadedData],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    state,
    isRefreshing,
    isTransferring,
    reload,
    refresh,
    transferSingle,
    transferAllPending,
    isAutoTransferEnabled,
  };
};
