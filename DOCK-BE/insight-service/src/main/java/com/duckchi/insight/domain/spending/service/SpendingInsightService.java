package com.duckchi.insight.domain.spending.service;

import com.duckchi.insight.domain.spending.dto.event.SettlementFinishedEvent;
import com.duckchi.insight.domain.spending.dto.response.CategorySpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlySummaryResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlyTrendResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomFrequencyResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomSpendResponse;
import java.util.List;

/**
 * 소비 분석 서비스 인터페이스.
 * 다른 서비스(RoomService, AccountService 등)와 동일한 interface/impl 패턴을 적용함.
 */
public interface SpendingInsightService {

    /**
     * 최근 3개월 소비 트렌드 조회 (AN-04)
     */
    List<MonthlyTrendResponse> getSpendingTrends(Long userId);

    /**
     * 지출 데이터가 존재하는 모든 월 조회 (AN-06)
     */
    List<String> getAvailableMonths(Long userId);

    /**
     * 월간 지출 요약 조회 (AN-02)
     * 이번 달 총 지출액과 이전 달 총 지출액을 비교함.
     */
    MonthlySummaryResponse getMonthlySummary(Long userId, String targetMonth);

    /**
     * 카테고리별 지출 통계 조회 (AN-01)
     * 각 카테고리가 해당 월 총 지출에서 차지하는 비중을 계산함.
     */
    List<CategorySpendResponse> getCategoryStatistics(Long userId, String targetMonth);

    /**
     * 방별 지출 통계 조회 (AN-03)
     * 방 ID로 통계 조회 후, 배치 페칭을 통해 방 이름을 매핑함.
     */
    List<RoomSpendResponse> getRoomStatistics(Long userId, String targetMonth);

    /**
     * 방별 정산 빈도 랭킹 조회 (AN-05)
     * 정산 횟수가 많은 방 순서로 랭킹을 매겨 조회함.
     */
    List<RoomFrequencyResponse> getRoomFrequencyRanking(Long userId, String targetMonth);

    /**
     * 정산 완료 이벤트를 처리하여 로그를 남기고 월간 통계를 업데이트함.
     */
    void processSettlementEvent(SettlementFinishedEvent event);
}
