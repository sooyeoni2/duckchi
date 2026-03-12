package com.duckchi.core.domain.account.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private AccountServiceImpl accountService;

    private RegisterBankAccountRequest request;

    @BeforeEach
    void setUp() {
        request = new RegisterBankAccountRequest("088", "1234567890123456");
    }

    // AUTH-03 서비스 정책 테스트: 중복 계좌, 상태 변경, 입력값 검증, 예외 변환을 검증한다.
    // 활성 VERIFIED 계좌가 이미 있으면 신규 등록을 막는지 확인한다.
    @Test
    @DisplayName("throws conflict when verified account already exists")
    void registerBankAccount_whenVerifiedAccountExists_thenThrowConflict() {
        Long userId = 1L;
        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(true);

        assertThatThrownBy(() -> accountService.registerBankAccount(userId, request))
                .isInstanceOf(CustomException.class)
                .extracting(ex -> ((CustomException) ex).getErrorCode())
                .isEqualTo(ErrorCode.ACCOUNT_ALREADY_REGISTERED);

        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    // 기존 PENDING 계좌가 있으면 EXPIRED로 전환한 뒤 새 PENDING 계좌를 등록하는지 확인한다.
    @Test
    @DisplayName("expires pending account and registers a new one")
    void registerBankAccount_whenPendingAccountExists_thenExpireAndRegisterNewAccount() {
        Long userId = 1L;
        UserAccount pendingAccount = UserAccount.builder()
                .id(10L)
                .userId(userId)
                .bankCode("020")
                .bankName("WOORI")
                .accountNumber("1111222233334444")
                .registeredAt(LocalDateTime.now())
                .status(AccountStatus.PENDING)
                .build();

        UserAccount savedAccount = UserAccount.builder()
                .id(20L)
                .userId(userId)
                .bankCode("088")
                .bankName("SHINHAN")
                .accountNumber("1234567890123456")
                .registeredAt(LocalDateTime.now())
                .status(AccountStatus.PENDING)
                .build();

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.of(pendingAccount));
        when(userAccountRepository.save(any(UserAccount.class))).thenReturn(savedAccount);

        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);

        assertThat(pendingAccount.getStatus()).isEqualTo(AccountStatus.EXPIRED);
        assertThat(response.accountId()).isEqualTo(20L);
        assertThat(response.bankCode()).isEqualTo("088");
        assertThat(response.bankName()).isEqualTo("SHINHAN");
        assertThat(response.maskedAccountNo()).isEqualTo("1234************");
        verify(userAccountRepository).save(any(UserAccount.class));
    }

    // 기존 VERIFIED, PENDING 계좌가 모두 없으면 정상적으로 새 계좌를 등록하는지 확인한다.
    @Test
    @DisplayName("registers new account when no verified or pending account exists")
    void registerBankAccount_whenNoExistingAccount_thenRegisterNewAccount() {
        Long userId = 1L;
        UserAccount savedAccount = UserAccount.builder()
                .id(30L)
                .userId(userId)
                .bankCode("088")
                .bankName("SHINHAN")
                .accountNumber("1234567890123456")
                .registeredAt(LocalDateTime.now())
                .status(AccountStatus.PENDING)
                .build();

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenReturn(savedAccount);

        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);

        assertThat(response.accountId()).isEqualTo(30L);
        assertThat(response.bankCode()).isEqualTo("088");
        assertThat(response.bankName()).isEqualTo("SHINHAN");
        assertThat(response.maskedAccountNo()).isEqualTo("1234************");
        verify(userAccountRepository).save(any(UserAccount.class));
    }

    // enum에 없는 bankCode가 들어오면 ACCOUNT_INVALID_INPUT 예외가 발생하는지 확인한다.
    @Test
    @DisplayName("throws bad request when bank code is invalid")
    void registerBankAccount_whenBankCodeInvalid_thenThrowBadRequest() {
        Long userId = 1L;
        RegisterBankAccountRequest invalidRequest = new RegisterBankAccountRequest("777", "1234567890123456");

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.registerBankAccount(userId, invalidRequest))
                .isInstanceOf(CustomException.class)
                .extracting(ex -> ((CustomException) ex).getErrorCode())
                .isEqualTo(ErrorCode.ACCOUNT_INVALID_INPUT);

        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    // 저장 과정에서 예상하지 못한 예외가 나면 도메인 정의 예외로 변환하는지 확인한다.
    @Test
    @DisplayName("converts unexpected save error to registration failure")
    void registerBankAccount_whenSaveFails_thenThrowInternalError() {
        Long userId = 1L;

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenThrow(new RuntimeException("db error"));

        assertThatThrownBy(() -> accountService.registerBankAccount(userId, request))
                .isInstanceOf(CustomException.class)
                .extracting(ex -> ((CustomException) ex).getErrorCode())
                .isEqualTo(ErrorCode.ACCOUNT_REGISTRATION_FAILED);
    }
}