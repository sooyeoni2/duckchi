package com.duckchi.core.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ProfileSetupRequest(
        @NotBlank(message = "name is required.")
        String name,
        String profileImageKey
) {
}
