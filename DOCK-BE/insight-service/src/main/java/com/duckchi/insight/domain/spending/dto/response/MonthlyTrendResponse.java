package com.duckchi.insight.domain.spending.dto.response;

/**
 * 월별 소비 트렌드 항목 (AN-04)
 */
public record MonthlyTrendResponse(
        String month,  // 기준월 (yyyy-MM)
        int totalAmount // 해당 월의 총 지출액
) {}