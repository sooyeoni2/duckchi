package com.duckchi.insight.domain.spending.type;

/**
 * 월간 지출 통계의 집계 유형을 나타내는 Enum.
 * DB CHECK 제약조건과 함께 애플리케이션 레벨에서 타입 안전성을 보장함.
 *
 * - TOTAL    : 해당 월의 전체 지출 합계 (stat_value = "ALL")
 * - CATEGORY : 카테고리별 지출 합계 (stat_value = 카테고리명, 예: "DINING")
 * - ROOM     : 방별 지출 합계 (stat_value = 방 ID, 예: "101")
 */
public enum StatType {
    TOTAL,
    CATEGORY,
    ROOM;

    /** TOTAL 타입의 stat_value 고정 상수. */
    public static final String ALL = "ALL";
}
