import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchSettlementItems } from '../models/settlementService';
import type {
  DeadlineTone,
  SettlementItem,
  SettlementScreenState,
  SettlementTab,
  SettlementViewItem,
} from '../models/settlementTypes';

const SAFE_THRESHOLD_SECONDS = 12 * 60 * 60;

const toDurationText = (seconds: number): string => {
  const absSeconds = Math.abs(seconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const remainSeconds = absSeconds % 60;

  return [hours, minutes, remainSeconds].map(value => String(value).padStart(2, '0')).join(':');
};

const getTone = (item: SettlementItem, nowMs: number): DeadlineTone => {
  if (item.status === 'COMPLETED') {
    return 'DONE';
  }

  const remainingSeconds = Math.floor((new Date(item.dueAt).getTime() - nowMs) / 1000);
  if (remainingSeconds >= SAFE_THRESHOLD_SECONDS) {
    return 'SAFE';
  }
  if (remainingSeconds >= 0) {
    return 'CAUTION';
  }
  return 'OVERDUE';
};

const getGuideMessage = (tone: DeadlineTone): string => {
  if (tone === 'SAFE') return '누구보다 빠르게 남들과는 다르게';
  if (tone === 'CAUTION') return '48시간 넘기면 거북이 정산러 등극 위기!';
  if (tone === 'OVERDUE') return '친구들이 다 알고 있어요....';
  return '';
};

const toViewItem = (item: SettlementItem, nowMs: number): SettlementViewItem => {
  const tone = getTone(item, nowMs);
  const remainingSeconds = Math.floor((new Date(item.dueAt).getTime() - nowMs) / 1000);

  if (tone === 'DONE') {
    const completedAt = item.paidAt ? new Date(item.paidAt) : new Date(item.dueAt);
    const hh = String(completedAt.getHours()).padStart(2, '0');
    const mm = String(completedAt.getMinutes()).padStart(2, '0');
    const ss = String(completedAt.getSeconds()).padStart(2, '0');

    return {
      ...item,
      timeLabel: '정산 시간',
      timeText: `${hh}:${mm}:${ss}`,
      tone,
      guideMessage: getGuideMessage(tone),
    };
  }

  return {
    ...item,
    timeLabel: remainingSeconds >= 0 ? '남은 시간' : '초과된 시간',
    timeText: toDurationText(remainingSeconds),
    tone,
    guideMessage: getGuideMessage(tone),
  };
};

export const useSettlementViewModel = () => {
  const [state, setState] = useState<SettlementScreenState>({ status: 'idle' });
  const [selectedTab, setSelectedTab] = useState<SettlementTab>('IN_PROGRESS');
  const [nowMs, setNowMs] = useState<number>(Date.now());

  const loadSettlements = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const items = await fetchSettlementItems();
      setState({ status: 'loaded', items });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '정산 목록을 불러오지 못했습니다.',
      });
    }
  }, []);

  const markAsPaid = useCallback((targetId: number) => {
    setState(prevState => {
      if (prevState.status !== 'loaded') {
        return prevState;
      }

      const updated = prevState.items.map(item => {
        if (item.id !== targetId || item.status !== 'IN_PROGRESS') {
          return item;
        }

        return {
          ...item,
          status: 'COMPLETED' as const,
          paidAt: new Date().toISOString(),
          paidCount: item.totalCount,
        };
      });

      return { status: 'loaded', items: updated };
    });
  }, []);

  const markAllAsPaid = useCallback(() => {
    setState(prevState => {
      if (prevState.status !== 'loaded') {
        return prevState;
      }

      const nowIso = new Date().toISOString();
      const updated = prevState.items.map(item => {
        if (item.status === 'COMPLETED') {
          return item;
        }

        return {
          ...item,
          status: 'COMPLETED' as const,
          paidAt: nowIso,
          paidCount: item.totalCount,
        };
      });

      return { status: 'loaded', items: updated };
    });
  }, []);

  useEffect(() => {
    if (state.status === 'idle') {
      loadSettlements();
    }
  }, [loadSettlements, state.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadedItems = state.status === 'loaded' ? state.items : [];

  const inProgressCount = useMemo(
    () => loadedItems.filter(item => item.status === 'IN_PROGRESS').length,
    [loadedItems],
  );

  const filteredItems = useMemo(() => {
    if (state.status !== 'loaded') {
      return [] as SettlementViewItem[];
    }

    return state.items
      .filter(item => item.status === selectedTab)
      .map(item => toViewItem(item, nowMs));
  }, [nowMs, selectedTab, state]);

  return {
    state,
    selectedTab,
    setSelectedTab,
    inProgressCount,
    settlementItems: filteredItems,
    markAsPaid,
    markAllAsPaid,
    reload: loadSettlements,
  };
};