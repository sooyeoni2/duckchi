package com.duckchi.core.domain.account.type;

public record PayPasswordFailureResult(
        PayPasswordFailureAction action,
        int failCount
) {
}
