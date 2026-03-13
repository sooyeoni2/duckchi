package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.BankCode;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.infra.finance.FinanceClient;
import com.duckchi.core.infra.finance.OneVerifyHeaderFactory;
import com.duckchi.core.infra.finance.dto.request.OpenAccountAuthRequest;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

//    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final FinanceClient financeClient;
    private final OneVerifyHeaderFactory oneVerifyHeaderFactory;

    //계좌 등록
    @Override
    public RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request) {
        // 사용자 유효성 검증
//        if (!userRepository.existsById(userId)) {
//            throw new CustomException(ErrorCode.AUTH_UNAUTHORIZED);
//        }
        if (userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)) {
            throw new CustomException(ErrorCode.ACCOUNT_ALREADY_REGISTERED);
        }

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
    //(계좌 등록 시 트리거) 1원 송금
    @Override
    public void sendOneWon(Long userId, String accountNo) {
        //TODO: userKey 하드코딩 된 것 인증 기능 추가되면 바꾸기
        //요청 생성
        OpenAccountAuthRequest request = new OpenAccountAuthRequest(
                oneVerifyHeaderFactory.create("openAccountAuth", "06ac95e7-e593-4f3f-8cc6-7f5d4ff47400"),
                accountNo,
                "SSAFY"
        );

        //1원 송금 API 호출
        try{
            financeClient.openAccountAuth(request);
        } catch(CustomException ex){
            throw ex;
        } catch(FeignException ex){
            throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
        } catch(Exception ex){
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }


    //1원 인증
    @Override
    public VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request) {
        throw new UnsupportedOperationException("Implement business logic for AUTH-04 verifyOneWon");
    }

    //계좌 삭제
    @Override
    public void deleteBankAccount(Long userId, Long accountId) {
        // 사용자 유효성 검증
//        if (!userRepository.existsById(userId)) {
//            throw new CustomException(ErrorCode.AUTH_UNAUTHORIZED);
//        }
        UserAccount userAccount = userAccountRepository.findByIdAndStatusAndDeletedAtIsNull(accountId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        userAccount.softDelete();
    }

    private String maskAccountNumber(String accountNumber) {
        int visibleLength = Math.min(4, accountNumber.length());
        return accountNumber.substring(0, visibleLength) + "*".repeat(accountNumber.length() - visibleLength);
    }
}
