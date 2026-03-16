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
import com.duckchi.core.infra.finance.dto.request.CheckAuthCodeRequest;
import com.duckchi.core.infra.finance.dto.request.OpenAccountAuthRequest;
import com.duckchi.core.infra.finance.dto.response.CheckAuthCodeResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

//    private final UserRepository userRepository;
    private static final String AUTH_TEXT = "SSAFY";
    private static final String TEMP_USER_KEY = "06ac95e7-e593-4f3f-8cc6-7f5d4ff47400";

    private final UserAccountRepository userAccountRepository;
    private final FinanceClient financeClient;
    private final OneVerifyHeaderFactory oneVerifyHeaderFactory;
    private final ObjectMapper objectMapper;

    @Override
    public RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request) {
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

    @Override
    public void sendOneWon(Long userId, String accountNo) {
        OpenAccountAuthRequest financeRequest = new OpenAccountAuthRequest(
                oneVerifyHeaderFactory.create("openAccountAuth", TEMP_USER_KEY),
                accountNo,
                AUTH_TEXT
        );

        try {
            financeClient.openAccountAuth(financeRequest);
        } catch (CustomException ex) {
            throw ex;
        } catch (FeignException ex) {
            throw parseFinanceException(ex);
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    @Override
    public VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request) {

        //이미 인증된 계좌인지 확인
        if (userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)) {
            throw new CustomException(ErrorCode.ACCOUNT_ALREADY_REGISTERED);
        }
        UserAccount userAccount = userAccountRepository.findByIdAndStatusAndDeletedAtIsNull(accountId, AccountStatus.PENDING)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        CheckAuthCodeRequest financeRequest = new CheckAuthCodeRequest(
                oneVerifyHeaderFactory.create("checkAuthCode", TEMP_USER_KEY),
                userAccount.getAccountNumber(),
                AUTH_TEXT,
                request.verificationCode()
        );

        try {
            CheckAuthCodeResponse financeResponse = financeClient.checkAuthCode(financeRequest);

            if (financeResponse.rec() == null || !"SUCCESS".equalsIgnoreCase(financeResponse.rec().status())) {
                throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
            }

            userAccount.verify();
            return new VerifyOneWonResponse(userAccount.getId(), true);
        } catch (CustomException ex) {
            throw ex;
        } catch (FeignException ex) {
            throw parseFinanceException(ex);
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    @Override
    public void deleteBankAccount(Long userId, Long accountId) {
        UserAccount userAccount = userAccountRepository.findByIdAndStatusAndDeletedAtIsNull(accountId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        userAccount.softDelete();
    }

    private CustomException parseFinanceException(FeignException ex) {
        String responseBody = ex.contentUTF8();
        log.warn("Finance API call failed. status={}, body={}", ex.status(), responseBody);

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode headerNode = root.path("Header");
            String responseCode = headerNode.path("responseCode").asText();
            String responseMessage = headerNode.path("responseMessage").asText();

            return switch (responseCode) {
                case "A1086" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_NOT_ISSUED);
                case "A1087" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_EXPIRED);
                case "A1088" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_MISMATCH);
                case "A1089" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_TEXT_INVALID);
                case "A1090" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_INVALID);
                default -> new CustomException(
                        responseMessage == null || responseMessage.isBlank()
                                ? ErrorCode.ACCOUNT_VERIFICATION_FAILED.getMsg()
                                : responseMessage,
                        ErrorCode.ACCOUNT_VERIFICATION_FAILED
                );
            };
        } catch (Exception parseException) {
            log.warn("Failed to parse finance error response body", parseException);
            return new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
        }
    }

    private String maskAccountNumber(String accountNumber) {
        int visibleLength = Math.min(4, accountNumber.length());
        return accountNumber.substring(0, visibleLength) + "*".repeat(accountNumber.length() - visibleLength);
    }
}
