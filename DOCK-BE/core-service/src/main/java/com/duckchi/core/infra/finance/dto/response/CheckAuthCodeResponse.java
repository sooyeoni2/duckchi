package com.duckchi.core.infra.finance.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CheckAuthCodeResponse(
        @JsonProperty("Header")
        OneVerifyApiResponseHeader header,
        @JsonProperty("REC")
        CheckAuthCodeResponseRec rec
) {
    public record CheckAuthCodeResponseRec(
            String status,
            String transactionUniqueNo,
            String accountNo
    ) {
    }
}
