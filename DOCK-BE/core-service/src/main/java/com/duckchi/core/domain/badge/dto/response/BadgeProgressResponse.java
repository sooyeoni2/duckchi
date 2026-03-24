package com.duckchi.core.domain.badge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * [BADGE-03] 뱃지 진행도 조회 응답 DTO.
 * 특정 미획득 뱃지의 현재 달성 진행도를 반환한다.
 */
@Getter
@AllArgsConstructor
@Builder
public class BadgeProgressResponse {

    // 목표 횟수 (badges.required_count)
    private final Integer requiredCount;

    // 현재 달성 횟수 (badge_progress.current_count)
    private final Integer currentCount;

    // 진행도 마지막 업데이트 일시
    private final LocalDateTime lastUpdatedAt;
}
