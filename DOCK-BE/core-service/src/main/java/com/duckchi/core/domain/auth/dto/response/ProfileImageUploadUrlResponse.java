package com.duckchi.core.domain.auth.dto.response;

public record ProfileImageUploadUrlResponse(
        String uploadUrl,
        String key,
        String fileUrl
) {
}
