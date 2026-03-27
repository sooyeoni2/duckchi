import { useCallback, useMemo, useRef, useState } from 'react';

import { fetchReportMonthData, fetchReportMonthOptions } from '../models/reportService';
import type { ReportMonthData, ReportMonthOption } from '../models/reportTypes';

const toMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '소비 리포트를 불러오지 못했습니다.';

export const useReportViewModel = () => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [monthOptions, setMonthOptions] = useState<ReportMonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportMonthData | null>(null);
  const [activeCategoryName, setActiveCategoryName] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const requestIdRef = useRef(0);

  const loadMonthData = useCallback(
    async (
      options: ReportMonthOption[],
      targetMonth: string,
      loadingMode: 'loading' | 'refreshing',
    ) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      // 왜: 월 전환을 연속으로 눌렀을 때 이전 요청 응답이 늦게 도착해 화면을 덮어쓰는 문제를 막는다.
      if (loadingMode === 'loading') {
        setStatus('loading');
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      try {
        const targetOption = options.find((item) => item.value === targetMonth);
        if (targetOption == null) {
          throw new Error('조회 가능한 월 정보가 없습니다.');
        }

        const data = await fetchReportMonthData(targetOption);

        // 왜: 최신 요청이 아니면 상태 반영을 버려서 잘못된 월 데이터가 노출되지 않게 한다.
        if (requestIdRef.current !== requestId) {
          return;
        }

        setSelectedMonth(targetMonth);
        setReportData(data);
        if (data.categories.length > 0) {
          setActiveCategoryName(data.categories[0].name);
        } else {
          setActiveCategoryName(null);
        }
        setStatus('loaded');
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }
        setStatus('error');
        setErrorMessage(toMessage(error));
      } finally {
        if (requestIdRef.current === requestId) {
          setIsRefreshing(false);
        }
      }
    },
    [],
  );

  const reload = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const options = await fetchReportMonthOptions();
      setMonthOptions(options);

      const lastOption = options[options.length - 1];
      if (lastOption == null) {
        throw new Error('조회 가능한 월 정보가 없습니다.');
      }

      await loadMonthData(options, lastOption.value, 'loading');
    } catch (error) {
      setStatus('error');
      setErrorMessage(toMessage(error));
    }
  }, [loadMonthData]);

  const refresh = useCallback(async () => {
    if (selectedMonth == null || monthOptions.length === 0) {
      await reload();
      return;
    }
    await loadMonthData(monthOptions, selectedMonth, 'refreshing');
  }, [loadMonthData, monthOptions, reload, selectedMonth]);

  const selectedIndex = useMemo(
    () => monthOptions.findIndex((item) => item.value === selectedMonth),
    [monthOptions, selectedMonth],
  );

  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < monthOptions.length - 1;

  const goPrevMonth = useCallback(async () => {
    if (!canGoPrev) {
      return;
    }
    const prevOption = monthOptions[selectedIndex - 1];
    if (prevOption == null) {
      return;
    }
    await loadMonthData(monthOptions, prevOption.value, 'loading');
  }, [canGoPrev, loadMonthData, monthOptions, selectedIndex]);

  const goNextMonth = useCallback(async () => {
    if (!canGoNext) {
      return;
    }
    const nextOption = monthOptions[selectedIndex + 1];
    if (nextOption == null) {
      return;
    }
    await loadMonthData(monthOptions, nextOption.value, 'loading');
  }, [canGoNext, loadMonthData, monthOptions, selectedIndex]);

  return {
    status,
    errorMessage,
    monthOptions,
    selectedMonth,
    reportData,
    activeCategoryName,
    setActiveCategoryName,
    canGoPrev,
    canGoNext,
    isRefreshing,
    reload,
    refresh,
    goPrevMonth,
    goNextMonth,
  };
};
