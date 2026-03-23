package com.duckchi.core.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProfileImageUploadUrlRequest(
        @NotBlank(message = "fileName is required.")
        String fileName,

        @NotBlank(message = "contentType is required.")
        String contentType
) {
}
