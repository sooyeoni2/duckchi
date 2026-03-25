package com.duckchi.insight.domain.spending.controller;

import com.duckchi.insight.domain.spending.dto.response.CategorySpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlySummaryResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomSpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlyTrendResponse;
import com.duckchi.insight.domain.spending.service.SpendingInsightService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 소비 분석 API 컨트롤러 (명세서 AN-01 ~ AN-04 준수)
 */
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class InsightController {

    private final SpendingInsightService insightService;

    /**
     * AN-01: 월간 카테고리별 지출 통계 조회
     */
    @GetMapping("/monthly/categories")
    public ResponseEntity<?> getCategoryStatistics(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("month") String month) {
        List<CategorySpendResponse> data = insightService.getCategoryStatistics(userId, month);
        return ResponseEntity.ok(new ApiResponse<>(true, data));
    }

    /**
     * AN-02: 월간 지출 요약 조회 (전월 대비)
     */
    @GetMapping("/monthly/summary")
    public ResponseEntity<?> getMonthlySummary(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("month") String month) {
        MonthlySummaryResponse data = insightService.getMonthlySummary(userId, month);
        return ResponseEntity.ok(new ApiResponse<>(true, data));
    }

    /**
     * AN-03: 월간 모임방 지출 랭킹 조회
     */
    @GetMapping("/monthly/rooms-ranking")
    public ResponseEntity<?> getRoomRanking(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("month") String month) {
        List<RoomSpendResponse> data = insightService.getRoomStatistics(userId, month);
        return ResponseEntity.ok(new ApiResponse<>(true, data));
    }

    /**
     * AN-04: 소비 트렌드 조회 (최근 6개월)
     */
    @GetMapping("/trends")
    public ResponseEntity<?> getTrends(@RequestHeader("X-User-Id") Long userId) {
        List<MonthlyTrendResponse> data = insightService.getSpendingTrends(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, data));
    }

    // 공통 응답 래퍼 클래스 (문서 명세 준수)
    private record ApiResponse<T>(boolean success, T data) {}
}
