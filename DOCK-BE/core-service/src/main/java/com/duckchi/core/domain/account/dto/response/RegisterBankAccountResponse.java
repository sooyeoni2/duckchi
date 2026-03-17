package com.duckchi.core.domain.account.dto.response;

public record RegisterBankAccountResponse(
        Long accountId,
        String bankCode,
        String bankName,
        String maskedAccountNo
) {
}
