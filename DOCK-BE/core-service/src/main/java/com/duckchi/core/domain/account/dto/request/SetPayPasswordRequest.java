package com.duckchi.core.domain.account.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SetPayPasswordRequest(
        @NotBlank(message = "결제 비밀번호는 필수입니다.")
        @Pattern(regexp = "^\\d{6}$", message = "결제 비밀번호는 6자리여야합니다.")
        String password
) {
}
