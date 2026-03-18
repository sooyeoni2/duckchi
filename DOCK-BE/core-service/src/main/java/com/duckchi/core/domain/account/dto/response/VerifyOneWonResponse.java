package com.duckchi.core.domain.account.dto.response;

public record VerifyOneWonResponse(
        Long accountId,
        boolean verified
) {
}
