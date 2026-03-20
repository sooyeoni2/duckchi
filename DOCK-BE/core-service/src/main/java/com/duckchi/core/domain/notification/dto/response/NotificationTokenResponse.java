package com.duckchi.core.domain.notification.dto.response;

import java.time.LocalDateTime;

public record NotificationTokenResponse(
        Long id,
        String deviceId,
        boolean notificationEnabled,
        boolean is_active,
        LocalDateTime updatedAt
) {
}
