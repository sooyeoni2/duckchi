package com.duckchi.core.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileBadgeResponse {

    private List<AcquiredBadge> acquiredBadges;
    private List<LockedBadge> lockedBadges;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcquiredBadge {
        private Long id;
        private String code;
        private String name;
        private String description;
        private LocalDateTime acquiredAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LockedBadge {
        private Long id;
        private String code;
        private String name;
        private String description;
        private Integer requiredCount;
        private Integer currentCount;
    }
}
