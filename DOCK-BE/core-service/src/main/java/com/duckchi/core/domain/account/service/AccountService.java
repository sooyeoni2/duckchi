package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;

public interface AccountService {

    RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request);

    void sendOneWon(Long userId, String accountNo);

    VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request);

    void deleteBankAccount(Long userId, Long accountId);
}
