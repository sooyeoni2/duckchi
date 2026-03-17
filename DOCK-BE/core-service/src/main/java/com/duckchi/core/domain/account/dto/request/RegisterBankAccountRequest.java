package com.duckchi.core.domain.account.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterBankAccountRequest(
        @NotBlank(message = "은행 코드는 필수입니다.")
        @Pattern(regexp = "^\\d{3}$", message = "은행 코드는 3자리 숫자여야 합니다.")
        String bankCode,

        @NotBlank(message = "계좌번호는 필수입니다.")
        @Pattern(regexp = "^\\d{10,20}$", message = "계좌번호는 10~20자리 숫자여야 합니다.")
        String accountNo
) {
}
