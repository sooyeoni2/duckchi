package com.duckchi.core.domain.user.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class NotificationSettingRequest {

    @NotNull
    private Boolean notificationEnabled;
}
