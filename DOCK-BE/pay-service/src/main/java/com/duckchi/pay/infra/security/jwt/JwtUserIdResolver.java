package com.duckchi.pay.infra.security.jwt;

import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUserIdResolver {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    public Long resolveRequired(String authorizationHeader) {
        Long userId = resolveOrNull(authorizationHeader);
        if (userId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }
        return userId;
    }

    public Long resolveOrNull(String authorizationHeader) {
        if (!StringUtils.hasText(authorizationHeader)) {
            log.warn("Authorization header missing");
            return null;
        }

        String normalizedHeader = authorizationHeader.trim();
        if (!startsWithBearerIgnoreCase(normalizedHeader)) {
            log.warn("Authorization header prefix invalid");
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        String token = normalizedHeader.substring(BEARER_PREFIX.length()).trim();
        if (!StringUtils.hasText(token)) {
            log.warn("Bearer token is empty");
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        if (!jwtProvider.validateToken(token)) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        return jwtProvider.getUserIdFromToken(token);
    }

    private boolean startsWithBearerIgnoreCase(String authorizationHeader) {
        return authorizationHeader.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length());
    }
}