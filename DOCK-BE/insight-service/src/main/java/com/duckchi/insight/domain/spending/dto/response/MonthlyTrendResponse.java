package com.duckchi.insight.domain.spending.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 월별 소비 트렌드 항목 (AN-04)
 * Record 대신 일반 클래스로 구현하여 IDE 호환성 확보
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendResponse {
    private String month;      // 기준월 (yyyy-MM)
    private int totalAmount;   // 해당 월의 총 지출액
}
