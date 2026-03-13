package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.BankCode;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

//    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    public RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request) {
        // 사용자 유효성 검증
//        if (!userRepository.existsById(userId)) {
//            throw new CustomException(ErrorCode.AUTH_UNAUTHORIZED);
//        }
        // 활성 등록 계좌가 있으면 중복 등록 불가
        if (userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)) {
            throw new CustomException(ErrorCode.ACCOUNT_ALREADY_REGISTERED);
        }
        // 기존 1원 인증 대기 계좌는 만료 처리 후 새 등록 진행
        userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING)
                .ifPresent(UserAccount::expire);

        BankCode bankCode = BankCode.from(request.bankCode());

        try {
            UserAccount userAccount = userAccountRepository.save(
                    UserAccount.builder()
                            .userId(userId)
                            .bankCode(bankCode.getCode())
                            .bankName(bankCode.getBankName())
                            .accountNumber(request.accountNo())
                            .status(AccountStatus.PENDING)
                            .build()
            );

            return new RegisterBankAccountResponse(
                    userAccount.getId(),
                    userAccount.getBankCode(),
                    userAccount.getBankName(),
                    maskAccountNumber(userAccount.getAccountNumber())
            );
        } catch (CustomException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.ACCOUNT_REGISTRATION_FAILED);
        }
    }

    @Override
    public void deleteBankAccount(Long userId, Long accountId) {
        // 사용자 유효성 검증
//        if (!userRepository.existsById(userId)) {
//            throw new CustomException(ErrorCode.AUTH_UNAUTHORIZED);
//        }
        //accountId가 유효한지 확인 (VERTIFIED고, deleted_at이 NULL인지 확인)
        UserAccount userAccount = userAccountRepository.findByIdAndStatusAndDeletedAtIsNull(accountId,AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));
        //계좌 soft delete 처리
        userAccount.softDelete();

    }

    private String maskAccountNumber(String accountNumber) {
        int visibleLength = Math.min(4, accountNumber.length());
        return accountNumber.substring(0, visibleLength) + "*".repeat(accountNumber.length() - visibleLength);
    }
}
