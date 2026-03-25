import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import {
  fetchRoomSettlementOverview,
  getEmptyRoomSettlementOverviewData,
} from '../models/roomSettlementOverviewService';
import type { RoomSettlementOverviewState } from '../models/roomSettlementOverviewTypes';

const toOverviewErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // room 데이터가 없는 404는 사용자 관점에서 "아직 데이터 없음"으로 안내하는 편이 명확하다.
    if (error.response?.status === 404) {
      return '모임 정산 데이터가 아직 없습니다.';
    }
    const serverMessage = (error.response?.data as { msg?: string } | undefined)?.msg;
    return serverMessage ?? error.message ?? '정산 탭 데이터를 불러오지 못했습니다.';
  }

  if (error instanceof Error) {
    return error.message;
  }
  return '정산 탭 데이터를 불러오지 못했습니다.';
};

export const useRoomSettlementOverviewViewModel = (roomId: number) => {
  const [state, setState] = useState<RoomSettlementOverviewState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetchRoomSettlementOverview(roomId);
      setState({ status: 'loaded', data });
    } catch (error) {
      setState({
        status: 'error',
        message: toOverviewErrorMessage(error),
        data: getEmptyRoomSettlementOverviewData(),
      });
    }
  }, [roomId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchRoomSettlementOverview(roomId);
      setState({ status: 'loaded', data });
    } catch (error) {
      setState({
        status: 'error',
        message: toOverviewErrorMessage(error),
        data: getEmptyRoomSettlementOverviewData(),
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [roomId]);

  useEffect(() => {
    void load();
  }, [load]);

  const overviewData = useMemo(() => {
    if (state.status === 'loaded' || state.status === 'error') {
      return state.data;
    }
    return getEmptyRoomSettlementOverviewData();
  }, [state]);

  return {
    state,
    overviewData,
    isRefreshing,
    reload: load,
    refresh,
  };
};
