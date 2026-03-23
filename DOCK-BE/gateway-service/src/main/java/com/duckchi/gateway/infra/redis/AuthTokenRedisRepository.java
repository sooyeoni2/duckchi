package com.duckchi.gateway.infra.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthTokenRedisRepository {

    private static final String BLACKLIST_TOKEN_KEY_PREFIX = "auth:blacklist:";

    private final StringRedisTemplate stringRedisTemplate;

    public boolean isBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(BLACKLIST_TOKEN_KEY_PREFIX + accessToken));
    }
}
