package com.duckchi.insight.domain.spending.controller;

import com.duckchi.insight.domain.spending.dto.response.CategorySpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlySummaryResponse;
import com.duckchi.insight.domain.spending.dto.response.RoomSpendResponse;
import com.duckchi.insight.domain.spending.dto.response.MonthlyTrendResponse;
import com.duckchi.insight.domain.spending.service.SpendingInsightService;
import com.duckchi.insight.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 소비 분석 API 컨트롤러 (명세서 AN-01 ~ AN-04 준수)
 * 사용자의 월별 지출 통계 및 트렌드를 제공함.
 */
@Tag(name = "Insight", description = "소비 분석 및 지출 통계 API")
@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class InsightController {

    private static final String USER_ID_HEADER = "X-User-Id";
    private final SpendingInsightService insightService;

    @Operation(summary = "AN-01: 월간 카테고리별 지출 통계 조회", 
               description = "요청한 월의 전체 지출 대비 카테고리별 비중을 조회함.")
    @GetMapping("/monthly/categories")
    public ApiResponseDto<List<CategorySpendResponse>> getCategoryStatistics(
            @Parameter(description = "사용자 식별자", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03", required = true)
            @RequestParam("month") String month) {
        return ApiResponseDto.success(insightService.getCategoryStatistics(userId, month));
    }

    @Operation(summary = "AN-02: 월간 지출 요약 조회", 
               description = "이번 달 총 지출액과 이전 달 지출액을 비교하여 증감액 정보를 제공함.")
    @GetMapping("/monthly/summary")
    public ApiResponseDto<MonthlySummaryResponse> getMonthlySummary(
            @Parameter(description = "사용자 식별자", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03", required = true)
            @RequestParam("month") String month) {
        return ApiResponseDto.success(insightService.getMonthlySummary(userId, month));
    }

    @Operation(summary = "AN-03: 월간 모임방 지출 랭킹 조회", 
               description = "요청한 월에 지출이 발생한 모임방을 금액 순으로 랭킹을 매겨 조회함.")
    @GetMapping("/monthly/rooms-ranking")
    public ApiResponseDto<List<RoomSpendResponse>> getRoomRanking(
            @Parameter(description = "사용자 식별자", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "조회 대상 월 (yyyy-MM)", example = "2026-03", required = true)
            @RequestParam("month") String month) {
        return ApiResponseDto.success(insightService.getRoomStatistics(userId, month));
    }

    @Operation(summary = "AN-04: 최근 6개월 소비 트렌드 조회", 
               description = "최근 6개월간의 월별 총 지출액 추이를 조회함.")
    @GetMapping("/trends")
    public ApiResponseDto<List<MonthlyTrendResponse>> getTrends(
            @Parameter(description = "사용자 식별자", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId) {
        return ApiResponseDto.success(insightService.getSpendingTrends(userId));
    }
}
