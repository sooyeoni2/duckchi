package com.duckchi.core.infra.finance.dto.response;

public record OneVerifyApiResponseHeader(
        String responseCode,
        String responseMessage,
        String apiName,
        String transmissionDate,
        String transmissionTime,
        String institutionCode,
        String apiKey,
        String apiServiceCode,
        String institutionTransactionUniqueNo
) {
}
