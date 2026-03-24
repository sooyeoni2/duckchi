package com.duckchi.core.domain.badge.service;

import com.duckchi.core.domain.user.dto.response.UserProfileBadgeResponse;

public interface BadgeService {

    UserProfileBadgeResponse getBadges(Long userId);
}
