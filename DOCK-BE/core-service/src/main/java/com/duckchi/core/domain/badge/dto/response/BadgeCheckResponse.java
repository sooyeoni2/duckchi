package com.duckchi.core.domain.badge.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [BADGE-02] 뱃지 조건 체크 응답 DTO.
 * 이번 요청에서 새로 획득한 뱃지 목록을 반환한다.
 */
@Getter
@Builder
@AllArgsConstructor
public class BadgeCheckResponse {

    /** 이번에 새로 획득한 뱃지 목록. 획득한 것이 없으면 빈 리스트. */
    private List<NewlyAcquiredBadgeDto> newlyAcquiredBadges;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class NewlyAcquiredBadgeDto {
        private Integer id;
        private String code;
        private String name;
        private String imageUrl;
        private LocalDateTime acquiredAt;
    }
}
