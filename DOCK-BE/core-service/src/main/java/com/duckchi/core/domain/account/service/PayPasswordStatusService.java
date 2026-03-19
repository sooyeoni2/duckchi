package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.type.PayPasswordFailureAction;
import com.duckchi.core.domain.account.type.PayPasswordFailureResult;
import com.duckchi.core.domain.user.entity.User;

public interface PayPasswordStatusService {

    PayPasswordFailureResult recordFailure(Long userId, Long accountId);
}
