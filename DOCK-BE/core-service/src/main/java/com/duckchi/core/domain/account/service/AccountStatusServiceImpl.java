package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountStatusServiceImpl implements AccountStatusService{

    private final UserAccountRepository userAccountRepository;

    //DB에 EXPIRED 표시
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markExpired(Long accountId) {
        UserAccount userAccount = userAccountRepository.findById(accountId)
                .orElseThrow(()-> new CustomException(ErrorCode.ACCOUNT_INVALID));
        userAccount.expire();
    }

    //DB에 LOCKED 표시
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markLocked(Long accountId) {
        UserAccount userAccount = userAccountRepository.findById(accountId)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        userAccount.lock();
    }
}
