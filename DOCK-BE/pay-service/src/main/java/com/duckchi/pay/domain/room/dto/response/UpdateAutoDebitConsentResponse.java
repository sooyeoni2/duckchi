package com.duckchi.pay.domain.room.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UpdateAutoDebitConsentResponse {

    private Long roomId;
    private Long userId;
    private String role;

    @JsonProperty("isAgreed")
    private boolean isAgreed;
}