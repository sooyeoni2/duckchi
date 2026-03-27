import { API_BASE_URL } from '@core/constants/apiConstants';
import { getAccessToken } from '@core/network/tokenManager';
import { useAuthStore } from '@features/auth/models/authStore';
import EventSource from 'react-native-sse';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import {
  getRoomRankingSnapshot,
  type RoomRankingItemResponse,
  type RoomRankingSnapshotResponse,
  type RoomRankingUpdateEventResponse,
} from '../models/roomService';

type RankingState =
  | { status: 'loading' }
  | { status: 'loaded'; data: RoomRankingSnapshotResponse }
  | { status: 'error'; message: string };

type RankingSseEventName =
  | 'ranking.connected'
  | 'ranking.updated'
  | 'ranking.resync-required';

const EMPTY_SNAPSHOT = (roomId: number): RoomRankingSnapshotResponse => ({
  roomId,
  asOf: new Date().toISOString(),
  revision: 0,
  my: null,
  top3: [],
  items: [],
});

const toErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { msg?: string } | undefined)?.msg;
    return serverMessage ?? error.message ?? '순위 정보를 불러오지 못했습니다.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '순위 정보를 불러오지 못했습니다.';
};

const parseEventData = <T>(data: string | null): T | null => {
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
};

export const useRoomRankingViewModel = (roomId: number) => {
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null);
  const [state, setState] = useState<RankingState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const eventSourceRef = useRef<EventSource<RankingSseEventName> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastRevisionRef = useRef(0);

  const closeSse = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.removeAllEventListeners();
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const loadSnapshot = useCallback(async (loading = true) => {
    if (loading) {
      setState({ status: 'loading' });
    }

    try {
      const snapshot = await getRoomRankingSnapshot(roomId);
      lastRevisionRef.current = snapshot.revision;
      setState({ status: 'loaded', data: snapshot });
      return snapshot;
    } catch (error) {
      setState({ status: 'error', message: toErrorMessage(error) });
      return null;
    }
  }, [roomId]);

  const connectSse = useCallback((sinceRevision: number) => {
    const accessToken = getAccessToken();
    const url = `${API_BASE_URL}/api/v1/rooms/${roomId}/rankings/stream?since=${sinceRevision}`;

    const eventSource = new EventSource<RankingSseEventName>(url, {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        Accept: 'text/event-stream',
      },
      pollingInterval: 0,
      timeout: 30000,
    });

    eventSourceRef.current = eventSource;

    const scheduleReconnect = () => {
      clearReconnectTimer();
      closeSse();

      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delayMs = Math.min(1000 * 2 ** (attempt - 1), 30000);

      reconnectTimerRef.current = setTimeout(() => {
        connectSse(lastRevisionRef.current);
      }, delayMs);
    };

    eventSource.addEventListener('open', () => {
      reconnectAttemptRef.current = 0;
    });

    eventSource.addEventListener('error', () => {
      scheduleReconnect();
    });

    eventSource.addEventListener('ranking.updated', (event) => {
      const payload = parseEventData<RoomRankingUpdateEventResponse>(event.data);
      if (!payload) {
        return;
      }

      lastRevisionRef.current = payload.revision;

      setState((prev) => {
        if (prev.status !== 'loaded') {
          return prev;
        }

        return {
          status: 'loaded',
          data: {
            ...prev.data,
            asOf: payload.asOf,
            revision: payload.revision,
            top3: payload.top3,
            items: payload.items,
            my: null,
          },
        };
      });
    });

    eventSource.addEventListener('ranking.resync-required', () => {
      void (async () => {
        const snapshot = await loadSnapshot(false);
        if (snapshot) {
          closeSse();
          connectSse(snapshot.revision);
        }
      })();
    });
  }, [API_BASE_URL, clearReconnectTimer, closeSse, loadSnapshot, roomId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const snapshot = await getRoomRankingSnapshot(roomId);
      lastRevisionRef.current = snapshot.revision;
      setState({ status: 'loaded', data: snapshot });
      closeSse();
      connectSse(snapshot.revision);
    } catch (error) {
      setState({ status: 'error', message: toErrorMessage(error) });
    } finally {
      setIsRefreshing(false);
    }
  }, [closeSse, connectSse, roomId]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const snapshot = await loadSnapshot(true);
      if (!active || !snapshot) {
        return;
      }
      connectSse(snapshot.revision);
    })();

    return () => {
      active = false;
      clearReconnectTimer();
      closeSse();
    };
  }, [clearReconnectTimer, closeSse, connectSse, loadSnapshot]);

  const snapshot = useMemo(() => {
    if (state.status === 'loaded') {
      return state.data;
    }
    return EMPTY_SNAPSHOT(roomId);
  }, [roomId, state]);

  const myRanking = useMemo<RoomRankingItemResponse | null>(() => {
    if (state.status !== 'loaded') {
      return null;
    }
    if (state.data.my) {
      return {
        userId: state.data.my.userId,
        userName: state.data.my.userName,
        userTag: state.data.my.userTag,
        profileImageUrl: state.data.my.profileImageUrl,
        amount: state.data.my.amount,
        rank: state.data.my.rank,
      };
    }
    if (currentUserId == null) {
      return null;
    }
    return state.data.items.find((item) => item.userId === currentUserId) ?? null;
  }, [currentUserId, state]);

  return {
    state,
    snapshot,
    myRanking,
    isRefreshing,
    refresh,
    reload: () => loadSnapshot(true),
  };
};

