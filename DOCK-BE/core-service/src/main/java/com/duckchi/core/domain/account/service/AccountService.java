package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.entity.UserAccount;

public interface AccountService {

    RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request);

    void sendOneWon(UserAccount userAccount);

    VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request);

    void deleteBankAccount(Long userId, Long accountId);
}
