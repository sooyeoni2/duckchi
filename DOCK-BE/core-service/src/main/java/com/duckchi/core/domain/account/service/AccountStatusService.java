package com.duckchi.core.domain.account.service;

public interface AccountStatusService {
    void markExpired(Long accountId);
    void markLocked(Long accountId);
}
