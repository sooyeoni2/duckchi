package com.duckchi.core.infra.finance.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CheckAuthCodeRequest(
        @JsonProperty("Header")
        OneVerifyApiRequestHeader header,
        String accountNo,
        String authText,
        String authCode
) {
}
