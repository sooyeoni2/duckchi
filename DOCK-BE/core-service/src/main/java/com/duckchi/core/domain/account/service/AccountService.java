package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;

public interface AccountService {
    //계좌 등록
    RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request);
    //1원 송금
    void sendOneWon(Long userId ,String accountNo);
    //1원 송금 검증
    VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request);
    //계좌 삭제
    void deleteBankAccount(Long userId, Long accountId);
}
