package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserInternalServiceImpl implements UserInternalService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public UserFinanceProfileResponse getUserFinanceProfile(Long userId) {
        // [1] 유저 존재 여부 및 ssafyUserKey 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // [2] 인증된 주 계좌 확인 (팀원 레포지토리 활용)
        UserAccount account = userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        return UserFinanceProfileResponse.builder()
                .ssafyUserKey(user.getSsafyUserKey())
                .accountNo(account.getAccountNumber())
                .build();
    }
}
