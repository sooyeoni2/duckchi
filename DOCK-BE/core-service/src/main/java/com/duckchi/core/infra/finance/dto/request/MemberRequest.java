package com.duckchi.core.infra.finance.dto.request;

public record MemberRequest(
        String apiKey,
        String userId
) {
}
