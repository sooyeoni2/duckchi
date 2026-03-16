package com.duckchi.core.infra.finance.dto.request;

public record OneVerifyApiRequestHeader(
        String apiName,
        String transmissionDate,
        String transmissionTime,
        String institutionCode,
        String fintechAppNo,
        String apiServiceCode,
        String institutionTransactionUniqueNo,
        String apiKey,
        String userKey
) {
}
