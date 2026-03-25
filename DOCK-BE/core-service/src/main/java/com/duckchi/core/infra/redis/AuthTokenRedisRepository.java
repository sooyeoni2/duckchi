package com.duckchi.core.infra.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthTokenRedisRepository {

    private static final String REFRESH_TOKEN_KEY_PREFIX = "auth:refresh:";
    private static final String BLACKLIST_TOKEN_KEY_PREFIX = "auth:blacklist:";

    private final StringRedisTemplate stringRedisTemplate;

    public void saveRefreshToken(Long userId, String refreshToken, Duration ttl) {
        stringRedisTemplate.opsForValue().set(refreshTokenKey(userId), refreshToken, ttl);
    }

    public Optional<String> findRefreshToken(Long userId) {
        return Optional.ofNullable(stringRedisTemplate.opsForValue().get(refreshTokenKey(userId)));
    }

    public void deleteRefreshToken(Long userId) {
        stringRedisTemplate.delete(refreshTokenKey(userId));
    }

    public void blacklistAccessToken(String accessToken, Duration ttl) {
        if (ttl == null || ttl.isNegative() || ttl.isZero()) {
            return;
        }

        stringRedisTemplate.opsForValue().set(blacklistTokenKey(accessToken), "logout", ttl);
    }

    private String refreshTokenKey(Long userId) {
        return REFRESH_TOKEN_KEY_PREFIX + userId;
    }

    private String blacklistTokenKey(String accessToken) {
        return BLACKLIST_TOKEN_KEY_PREFIX + accessToken;
    }
}
