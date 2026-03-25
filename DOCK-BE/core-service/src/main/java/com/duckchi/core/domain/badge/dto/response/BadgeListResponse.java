package com.duckchi.core.domain.badge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [BADGE-01] 뱃지 목록 조회 응답 DTO.
 * 획득한 뱃지 목록(acquiredBadges)과 미획득 뱃지 목록(lockedBadges)을 분리하여 반환한다.
 * FE의 BadgeList 타입과 1:1 대응.
 */
@Getter
@AllArgsConstructor
@Builder
public class BadgeListResponse {

    private final List<AcquiredBadgeDto> acquiredBadges;
    private final List<LockedBadgeDto> lockedBadges;

    /**
     * 획득 뱃지 정보
     */
    @Getter
    @AllArgsConstructor
    @Builder
    public static class AcquiredBadgeDto {
        private final Long id;          // user_badges.id
        private final String code;      // badges.code
        private final String name;      // badges.name
        private final String description; // badges.description
        private final String imageUrl;  // badges.image_url
        private final LocalDateTime acquiredAt; // user_badges.acquired_at
    }

    /**
     * 미획득(잠금) 뱃지 정보 + 진행도
     */
    @Getter
    @AllArgsConstructor
    @Builder
    public static class LockedBadgeDto {
        private final Integer id;       // badges.id
        private final String code;      // badges.code
        private final String name;      // badges.name
        private final String description; // badges.description
        private final String imageUrl;  // badges.image_url
        private final Integer requiredCount; // badges.required_count
        private final Integer currentCount;  // badge_progress.current_count (없으면 0)
    }
}
