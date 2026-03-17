package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.AccountLockInfoResponse;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.infra.finance.FinanceClient;
import com.duckchi.core.infra.finance.FinanceExceptionParser;
import com.duckchi.core.infra.finance.OneVerifyHeaderFactory;
import com.duckchi.core.infra.finance.dto.request.CheckAuthCodeRequest;
import com.duckchi.core.infra.finance.dto.request.OneVerifyApiRequestHeader;
import com.duckchi.core.infra.finance.dto.request.OpenAccountAuthRequest;
import com.duckchi.core.infra.finance.dto.response.CheckAuthCodeResponse;
import com.duckchi.core.infra.finance.dto.response.OneVerifyApiResponseHeader;
import com.duckchi.core.infra.finance.dto.response.OpenAccountAuthResponse;
import com.duckchi.core.infra.redis.OneVerifyRedisRepository;
import com.duckchi.core.infra.redis.dto.OneVerifyCacheEntry;
import feign.FeignException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountStatusService accountStatusService;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private OneVerifyRedisRepository oneVerifyRedisRepository;

    @Mock
    private FinanceClient financeClient;

    @Mock
    private OneVerifyHeaderFactory oneVerifyHeaderFactory;

    @Mock
    private FinanceExceptionParser financeExceptionParser;

    @InjectMocks
    private AccountServiceImpl accountService;

    @Test
    void registerBankAccount_whenRequestIsValid_savesPendingAccountAndStoresRedisState() {
        // given: 기존 verified, pending, locked 계좌가 없고 금융망 송금 요청도 정상 처리된다.
        Long userId = 1L;
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        UserAccount savedAccount = createPendingAccount(10L, userId, "088", "신한은행", "123456789012");

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());
        when(userAccountRepository.findByUserIdAndBankCodeAndAccountNumberAndStatusAndDeletedAtIsNull(
                userId, "088", "123456789012", AccountStatus.LOCKED))
                .thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenReturn(savedAccount);
        when(oneVerifyHeaderFactory.create(eq("openAccountAuth"), any(String.class)))
                .thenReturn(dummyHeader("openAccountAuth"));
        when(financeClient.openAccountAuth(any(OpenAccountAuthRequest.class)))
                .thenReturn(new OpenAccountAuthResponse(
                        dummyResponseHeader("H0000", "정상처리 되었습니다."),
                        new OpenAccountAuthResponse.OpenAccountAuthResponseRec("999", "123456789012")
                ));

        // when: 계좌 등록을 요청한다.
        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);

        // then: DB 저장과 1원 송금, Redis pending 저장이 함께 수행된다.
        assertThat(response.accountId()).isEqualTo(10L);
        assertThat(response.bankCode()).isEqualTo("088");
        assertThat(response.bankName()).isEqualTo("신한은행");
        assertThat(response.maskedAccountNo()).isEqualTo("1234********");

        verify(userAccountRepository).save(any(UserAccount.class));
        verify(financeClient).openAccountAuth(any(OpenAccountAuthRequest.class));
        verify(oneVerifyRedisRepository).savePending(10L, userId, "123456789012", Duration.ofMinutes(5));
    }

    @Test
    void registerBankAccount_whenSameLockedAccountExists_throwsLockedExceptionWithLockInfo() {
        // given: 같은 사용자/은행/계좌번호 조합으로 이미 잠긴 계좌가 존재한다.
        Long userId = 1L;
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        UserAccount lockedAccount = createLockedAccount(33L, userId, "088", "신한은행", "123456789012");

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());
        when(userAccountRepository.findByUserIdAndBankCodeAndAccountNumberAndStatusAndDeletedAtIsNull(
                userId, "088", "123456789012", AccountStatus.LOCKED))
                .thenReturn(Optional.of(lockedAccount));
        when(oneVerifyRedisRepository.getRemainingLockSeconds(33L)).thenReturn(3600L);

        // when & then: 잠금 예외와 함께 lock 해제 시각 정보가 내려간다.
        assertThatThrownBy(() -> accountService.registerBankAccount(userId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_VERIFICATION_LOCKED);
                    assertThat(ex.getData()).isInstanceOf(AccountLockInfoResponse.class);
                    AccountLockInfoResponse data = (AccountLockInfoResponse) ex.getData();
                    assertThat(data.lockedUntil()).isAfter(LocalDateTime.now().plusMinutes(59));
                });

        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void verifyOneWon_whenFinanceVerificationSucceeds_marksAccountVerifiedAndDeletesRedisKey() {
        // given: DB의 pending 계좌와 Redis pending 상태가 존재하고 금융망 검증이 성공한다.
        Long userId = 1L;
        Long accountId = 55L;
        VerifyOneWonRequest request = new VerifyOneWonRequest("1234");
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "신한은행", "123456789012");
        OneVerifyCacheEntry cache = new OneVerifyCacheEntry("PENDING", 0, "123456789012", userId, LocalDateTime.now().toString());
        CheckAuthCodeResponse financeResponse = new CheckAuthCodeResponse(
                dummyResponseHeader("H0000", "정상처리 되었습니다."),
                new CheckAuthCodeResponse.CheckAuthCodeResponseRec("SUCCESS", "999", "123456789012")
        );

        when(userAccountRepository.findByIdAndUserIdAndDeletedAtIsNull(accountId, userId))
                .thenReturn(Optional.of(pendingAccount));
        when(oneVerifyRedisRepository.find(accountId)).thenReturn(Optional.of(cache));
        when(oneVerifyHeaderFactory.create(eq("checkAuthCode"), any(String.class)))
                .thenReturn(dummyHeader("checkAuthCode"));
        when(financeClient.checkAuthCode(any(CheckAuthCodeRequest.class))).thenReturn(financeResponse);

        // when: 1원 인증 검증을 요청한다.
        VerifyOneWonResponse response = accountService.verifyOneWon(userId, accountId, request);

        // then: 계좌는 verified 처리되고 Redis key가 삭제된다.
        assertThat(response.accountId()).isEqualTo(accountId);
        assertThat(response.verified()).isTrue();
        assertThat(pendingAccount.getStatus()).isEqualTo(AccountStatus.VERIFIED);
        assertThat(pendingAccount.getRegisteredAt()).isNotNull();
        verify(oneVerifyRedisRepository).delete(accountId);
    }

    @Test
    void verifyOneWon_whenRedisKeyIsMissing_marksExpiredAndThrowsExpiredException() {
        // given: DB에는 pending 계좌가 있지만 Redis key는 이미 만료되었다.
        Long userId = 1L;
        Long accountId = 77L;
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "신한은행", "123456789012");

        when(userAccountRepository.findByIdAndUserIdAndDeletedAtIsNull(accountId, userId))
                .thenReturn(Optional.of(pendingAccount));
        when(oneVerifyRedisRepository.find(accountId)).thenReturn(Optional.empty());

        // when & then: 별도 상태 서비스로 EXPIRED 저장 후 만료 예외를 던진다.
        assertThatThrownBy(() -> accountService.verifyOneWon(userId, accountId, new VerifyOneWonRequest("1234")))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_AUTH_CODE_EXPIRED);
                });

        verify(accountStatusService).markExpired(accountId);
        verify(financeClient, never()).checkAuthCode(any(CheckAuthCodeRequest.class));
    }

    @Test
    void verifyOneWon_whenFailCountReachesThree_locksAccountAndThrowsLockedExceptionWithData() {
        // given: pending 계좌가 있고 금융망 검증 결과가 인증코드 오류이며 이번 실패로 3회가 된다.
        Long userId = 1L;
        Long accountId = 91L;
        VerifyOneWonRequest request = new VerifyOneWonRequest("1234");
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "신한은행", "123456789012");
        OneVerifyCacheEntry cache = new OneVerifyCacheEntry("PENDING", 2, "123456789012", userId, LocalDateTime.now().toString());
        CustomException invalidCodeException = new CustomException("인증코드가 유효하지 않습니다.", ErrorCode.ACCOUNT_AUTH_CODE_INVALID);

        when(userAccountRepository.findByIdAndUserIdAndDeletedAtIsNull(accountId, userId))
                .thenReturn(Optional.of(pendingAccount));
        when(oneVerifyRedisRepository.find(accountId)).thenReturn(Optional.of(cache));
        when(oneVerifyHeaderFactory.create(eq("checkAuthCode"), any(String.class)))
                .thenReturn(dummyHeader("checkAuthCode"));
        FeignException feignException = org.mockito.Mockito.mock(FeignException.class);

        when(financeClient.checkAuthCode(any(CheckAuthCodeRequest.class))).thenThrow(feignException);
        when(financeExceptionParser.parseCheckAuthCodeException(feignException)).thenReturn(invalidCodeException);
        when(oneVerifyRedisRepository.increaseFailCount(accountId)).thenReturn(3);
        when(oneVerifyRedisRepository.getRemainingLockSeconds(accountId)).thenReturn(86400L);

        // when & then: Redis와 DB 잠금 처리 후 lock info를 담은 예외를 반환한다.
        assertThatThrownBy(() -> accountService.verifyOneWon(userId, accountId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_VERIFICATION_LOCKED);
                    assertThat(ex.getData()).isInstanceOf(AccountLockInfoResponse.class);
                    AccountLockInfoResponse data = (AccountLockInfoResponse) ex.getData();
                    assertThat(data.lockedUntil()).isAfter(LocalDateTime.now().plusHours(23));
                });

        verify(oneVerifyRedisRepository).lock(accountId, Duration.ofHours(24));
        verify(accountStatusService).markLocked(accountId);
    }

    @Test
    void deleteBankAccount_whenOwnedVerifiedAccountExists_softDeletesAccount() {
        // given: 현재 사용자의 verified 계좌가 존재한다.
        Long userId = 1L;
        Long accountId = 11L;
        UserAccount verifiedAccount = createVerifiedAccount(accountId, userId, "088", "신한은행", "123456789012");

        when(userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(verifiedAccount));

        // when: 계좌 삭제를 요청한다.
        accountService.deleteBankAccount(userId, accountId);

        // then: soft delete 시각이 기록된다.
        assertThat(verifiedAccount.getDeletedAt()).isNotNull();
    }

    private UserAccount createPendingAccount(Long id, Long userId, String bankCode, String bankName, String accountNumber) {
        return UserAccount.builder()
                .id(id)
                .userId(userId)
                .bankCode(bankCode)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .status(AccountStatus.PENDING)
                .authRequestedAt(LocalDateTime.now())
                .build();
    }

    private UserAccount createLockedAccount(Long id, Long userId, String bankCode, String bankName, String accountNumber) {
        return UserAccount.builder()
                .id(id)
                .userId(userId)
                .bankCode(bankCode)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .status(AccountStatus.LOCKED)
                .authRequestedAt(LocalDateTime.now().minusMinutes(1))
                .build();
    }

    private UserAccount createVerifiedAccount(Long id, Long userId, String bankCode, String bankName, String accountNumber) {
        return UserAccount.builder()
                .id(id)
                .userId(userId)
                .bankCode(bankCode)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .status(AccountStatus.VERIFIED)
                .registeredAt(LocalDateTime.now().minusDays(1))
                .authRequestedAt(LocalDateTime.now().minusDays(1))
                .build();
    }

    private OneVerifyApiRequestHeader dummyHeader(String apiName) {
        return new OneVerifyApiRequestHeader(
                apiName,
                "20260317",
                "120000",
                "00100",
                "001",
                apiName,
                "20260317120000000001",
                "api-key",
                "user-key"
        );
    }

    private OneVerifyApiResponseHeader dummyResponseHeader(String responseCode, String responseMessage) {
        return new OneVerifyApiResponseHeader(
                responseCode,
                responseMessage,
                "checkAuthCode",
                "20260317",
                "120000",
                "00100",
                "api-key",
                "checkAuthCode",
                "20260317120000000001"
        );
    }
}
