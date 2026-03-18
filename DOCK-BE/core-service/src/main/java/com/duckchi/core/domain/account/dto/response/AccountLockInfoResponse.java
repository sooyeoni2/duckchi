package com.duckchi.core.domain.account.dto.response;

import java.time.LocalDateTime;

public record AccountLockInfoResponse(LocalDateTime lockedUntil ) {

}
