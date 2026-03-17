package com.duckchi.core.domain.account.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOneWonRequest(
        @NotBlank(message = "인증코드는 필수입니다.")
        @Pattern(regexp = "^\\d{4}$", message = "인증코드는 4자리 숫자여야 합니다.")
        String verificationCode
) {
}
