package com.duckchi.core.domain.auth.dto.response;

public record ProfileSetupResponse(
        Long userId,
        String name,
        String tag,
        String profileImageUrl
) {
}
