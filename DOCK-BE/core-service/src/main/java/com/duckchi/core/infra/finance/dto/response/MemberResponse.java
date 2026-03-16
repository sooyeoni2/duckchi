package com.duckchi.core.infra.finance.dto.response;

public record MemberResponse(
        String userId,
        String userName,
        String userKey,
        String createdDate,
        String modifiedDate
) {
}
