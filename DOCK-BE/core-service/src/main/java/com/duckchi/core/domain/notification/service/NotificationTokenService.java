package com.duckchi.core.domain.notification.service;

import com.duckchi.core.domain.notification.dto.request.UpsertNotificationTokenRequest;
import com.duckchi.core.domain.notification.dto.response.NotificationTokenResponse;

public interface NotificationTokenService {

    NotificationTokenResponse upsert(Long userId, UpsertNotificationTokenRequest request);
}
