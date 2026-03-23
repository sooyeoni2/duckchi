package com.duckchi.insight.domain.spending.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "월간 지출 요약 응답")
public record MonthlySummaryResponse(
    @Schema(description = "조회 대상 월 (yyyy-MM)", example = "2026-03")
    String targetMonth,
    
    @Schema(description = "해당 월 총 지출액", example = "65000")
    Integer totalAmount,
    
    @Schema(description = "이전 월 총 지출액", example = "50000")
    Integer previousMonthAmount,
    
    @Schema(description = "전월 대비 증감액", example = "15000")
    Integer difference
) {}
