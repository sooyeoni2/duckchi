package com.duckchi.core.domain.notification.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertNotificationTokenRequest(
        @NotBlank(message = "deviceId는 필수입니다.")
        @Size(max = 100, message = "deviceId는 100자 이하여야 합니다.")
        String deviceId,

        @NotBlank(message = "token은 필수입니다.")
        @Size(max = 512, message = "token은 512자 이하여야 합니다.")
        String token,

        Boolean notificationEnabled
) {
}
