package com.duckchi.core.infra.finance.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OpenAccountAuthResponse(
        @JsonProperty("Header")
        OneVerifyApiResponseHeader header,
        @JsonProperty("REC")
        OpenAccountAuthResponseRec rec
) {
    public record OpenAccountAuthResponseRec(
            String transactionUniqueNo,
            String accountNo
    ) {
    }
}
