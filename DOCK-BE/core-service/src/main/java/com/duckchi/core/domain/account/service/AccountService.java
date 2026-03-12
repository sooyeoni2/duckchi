package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;

public interface AccountService {

    RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request);
}
