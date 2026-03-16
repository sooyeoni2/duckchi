package com.duckchi.core.infra.finance.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OpenAccountAuthRequest(
        @JsonProperty("Header")
        OneVerifyApiRequestHeader header,
        String accountNo,
        String authText
) {
}
