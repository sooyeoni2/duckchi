package com.duckchi.core.domain.notification.repository;

import com.duckchi.core.domain.notification.entity.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, Long> {

    Optional<UserFcmToken> findByUserIdAndDeviceId(Long userId, String deviceId);

    Optional<UserFcmToken> findByFcmToken(String fcmToken);
}
