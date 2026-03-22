package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.SetPayPasswordRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.request.VerifyPayPasswordRequest;
import com.duckchi.core.domain.account.dto.response.AccountLockInfoResponse;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.PayPasswordFailureAction;
import com.duckchi.core.domain.account.type.PayPasswordFailureResult;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.global.security.PayPasswordSecurityHelper;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountStatusService accountStatusService;

    @Mock
    private PayPasswordStatusService payPasswordStatusService;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OneVerifyRedisRepository oneVerifyRedisRepository;

    @Mock
    private FinanceClient financeClient;

    @Mock
    private OneVerifyHeaderFactory oneVerifyHeaderFactory;

    @Mock
    private FinanceExceptionParser financeExceptionParser;

    @Mock
    private PayPasswordSecurityHelper payPasswordSecurityHelper;

    @InjectMocks
    private AccountServiceImpl accountService;

    @Test
    void registerBankAccount_whenRequestIsValid_savesPendingAccountAndStoresRedisState() {
        // given: verified, pending, locked 계좌가 없고 금융망 호출이 성공한다.
        Long userId = 1L;
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        UserAccount savedAccount = createPendingAccount(10L, userId, "088", "bank", "123456789012");

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
                        dummyResponseHeader("H0000", "success"),
                        new OpenAccountAuthResponse.OpenAccountAuthResponseRec("999", "123456789012")
                ));

        // when: 계좌 등록을 요청한다.
        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);

        // then: pending 계좌가 저장되고 redis pending 상태가 기록된다.
        assertThat(response.accountId()).isEqualTo(10L);
        assertThat(response.bankCode()).isEqualTo("088");
        assertThat(response.bankName()).isEqualTo("bank");
        assertThat(response.maskedAccountNo()).isEqualTo("1234********");

        verify(userAccountRepository).save(any(UserAccount.class));
        verify(financeClient).openAccountAuth(any(OpenAccountAuthRequest.class));
        verify(oneVerifyRedisRepository).savePending(10L, userId, "123456789012", Duration.ofMinutes(5));
    }

    @Test
    void registerBankAccount_whenSameLockedAccountExists_throwsLockedExceptionWithLockInfo() {
        // given: 동일한 계좌가 lock 상태로 존재한다.
        Long userId = 1L;
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        UserAccount lockedAccount = createLockedAccount(33L, userId, "088", "bank", "123456789012");

        when(userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING))
                .thenReturn(Optional.empty());
        when(userAccountRepository.findByUserIdAndBankCodeAndAccountNumberAndStatusAndDeletedAtIsNull(
                userId, "088", "123456789012", AccountStatus.LOCKED))
                .thenReturn(Optional.of(lockedAccount));
        when(oneVerifyRedisRepository.getRemainingLockSeconds(33L)).thenReturn(3600L);

        // when & then: lock 정보와 함께 예외를 반환한다.
        assertThatThrownBy(() -> accountService.registerBankAccount(userId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_VERIFICATION_LOCKED);
                    assertThat(ex.getData()).isInstanceOf(AccountLockInfoResponse.class);
                });

        verify(userAccountRepository, never()).save(any(UserAccount.class));
    }

    @Test
    void verifyOneWon_whenFinanceVerificationSucceeds_marksAccountVerifiedAndDeletesRedisKey() {
        // given: pending 계좌와 redis pending 상태, 금융망 성공 응답이 준비되어 있다.
        Long userId = 1L;
        Long accountId = 55L;
        VerifyOneWonRequest request = new VerifyOneWonRequest("1234");
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "bank", "123456789012");
        OneVerifyCacheEntry cache = new OneVerifyCacheEntry("PENDING", 0, "123456789012", userId, LocalDateTime.now().toString());
        CheckAuthCodeResponse financeResponse = new CheckAuthCodeResponse(
                dummyResponseHeader("H0000", "success"),
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

        // then: 계좌가 verified 상태로 전환되고 redis key가 삭제된다.
        assertThat(response.accountId()).isEqualTo(accountId);
        assertThat(response.verified()).isTrue();
        assertThat(pendingAccount.getStatus()).isEqualTo(AccountStatus.VERIFIED);
        assertThat(pendingAccount.getRegisteredAt()).isNotNull();
        verify(oneVerifyRedisRepository).delete(accountId);
    }

    @Test
    void verifyOneWon_whenRedisKeyIsMissing_marksExpiredAndThrowsExpiredException() {
        // given: DB에는 pending 계좌가 있지만 redis key는 없다.
        Long userId = 1L;
        Long accountId = 77L;
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "bank", "123456789012");

        when(userAccountRepository.findByIdAndUserIdAndDeletedAtIsNull(accountId, userId))
                .thenReturn(Optional.of(pendingAccount));
        when(oneVerifyRedisRepository.find(accountId)).thenReturn(Optional.empty());

        // when & then: EXPIRED 처리 후 만료 예외를 반환한다.
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
        // given: 인증 코드 오입력으로 실패 횟수가 3회가 되는 상황이다.
        Long userId = 1L;
        Long accountId = 91L;
        VerifyOneWonRequest request = new VerifyOneWonRequest("1234");
        UserAccount pendingAccount = createPendingAccount(accountId, userId, "088", "bank", "123456789012");
        OneVerifyCacheEntry cache = new OneVerifyCacheEntry("PENDING", 2, "123456789012", userId, LocalDateTime.now().toString());
        CustomException invalidCodeException = new CustomException("invalid", ErrorCode.ACCOUNT_AUTH_CODE_INVALID);
        FeignException feignException = org.mockito.Mockito.mock(FeignException.class);

        when(userAccountRepository.findByIdAndUserIdAndDeletedAtIsNull(accountId, userId))
                .thenReturn(Optional.of(pendingAccount));
        when(oneVerifyRedisRepository.find(accountId)).thenReturn(Optional.of(cache));
        when(oneVerifyHeaderFactory.create(eq("checkAuthCode"), any(String.class)))
                .thenReturn(dummyHeader("checkAuthCode"));
        when(financeClient.checkAuthCode(any(CheckAuthCodeRequest.class))).thenThrow(feignException);
        when(financeExceptionParser.parseCheckAuthCodeException(feignException)).thenReturn(invalidCodeException);
        when(oneVerifyRedisRepository.increaseFailCount(accountId)).thenReturn(3);
        when(oneVerifyRedisRepository.getRemainingLockSeconds(accountId)).thenReturn(86400L);

        // when & then: 계좌 lock 처리 후 lock 예외를 반환한다.
        assertThatThrownBy(() -> accountService.verifyOneWon(userId, accountId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_VERIFICATION_LOCKED);
                    assertThat(ex.getData()).isInstanceOf(AccountLockInfoResponse.class);
                });

        verify(oneVerifyRedisRepository).lock(accountId, Duration.ofHours(24));
        verify(accountStatusService).markLocked(accountId);
    }

    @Test
    void deleteBankAccount_whenOwnedVerifiedAccountExists_softDeletesAccount() {
        // given: 본인 소유 verified 계좌가 있다.
        Long userId = 1L;
        Long accountId = 11L;
        UserAccount verifiedAccount = createVerifiedAccount(accountId, userId, "088", "bank", "123456789012");

        when(userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(verifiedAccount));

        // when: 계좌 삭제를 요청한다.
        accountService.deleteBankAccount(userId, accountId);

        // then: soft delete가 적용된다.
        assertThat(verifiedAccount.getDeletedAt()).isNotNull();
    }

    @Test
    void setPayPassword_whenUserDoesNotHavePayPassword_storesEncodedPassword() {
        // given: 결제 비밀번호가 아직 없는 유저와 인코딩 결과가 준비되어 있다.
        Long userId = 1L;
        SetPayPasswordRequest request = new SetPayPasswordRequest("123456");
        User user = createUser(userId, null, 0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(payPasswordSecurityHelper.encode("123456")).thenReturn("encoded-pay-password");

        // when: 결제 비밀번호 설정을 요청한다.
        accountService.setPayPassword(userId, request);

        // then: 인코딩된 비밀번호가 저장된다.
        assertThat(user.getPayPassword()).isEqualTo("encoded-pay-password");
        verify(payPasswordSecurityHelper).encode("123456");
    }

    @Test
    void setPayPassword_whenUserAlreadyHasPayPassword_throwsAlreadySetException() {
        // given: 이미 결제 비밀번호가 설정된 유저가 있다.
        Long userId = 1L;
        User user = createUser(userId, "encoded-existing-password", 0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // when & then: 중복 설정 예외를 반환한다.
        assertThatThrownBy(() -> accountService.setPayPassword(userId, new SetPayPasswordRequest("123456")))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PAY_PASSWORD_ALREADY_SET);
                });

        verify(payPasswordSecurityHelper, never()).encode(any());
    }

    @Test
    void verifyPayPassword_whenPasswordMatches_resetsFailCount() {
        // given: 결제 비밀번호가 설정되어 있고 실패 횟수가 누적된 유저가 있다.
        Long userId = 1L;
        User user = createUser(userId, "encoded-password", 2);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(payPasswordSecurityHelper.matches("123456", "encoded-password")).thenReturn(true);

        // when: 올바른 결제 비밀번호로 검증한다.
        accountService.verifyPayPassword(userId, new VerifyPayPasswordRequest("123456"));

        // then: 실패 횟수가 초기화된다.
        assertThat(user.getPayPasswordFailCnt()).isZero();
    }

    @Test
    void verifyPayPassword_whenPasswordDoesNotMatch_throwsMismatchWithLatestFailCount() {
        // given: 정책 서비스가 최신 실패 횟수 1을 반환한다.
        Long userId = 1L;
        User user = createUser(userId, "encoded-password", 0);
        UserAccount verifiedAccount = createVerifiedAccount(11L, userId, "088", "bank", "123456789012");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(payPasswordSecurityHelper.matches("123456", "encoded-password")).thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(verifiedAccount));
        when(payPasswordStatusService.recordFailure(userId, 11L))
                .thenReturn(new PayPasswordFailureResult(PayPasswordFailureAction.MISMATCH, 1));

        // when & then: mismatch 예외와 최신 실패 횟수 데이터가 반환된다.
        assertThatThrownBy(() -> accountService.verifyPayPassword(userId, new VerifyPayPasswordRequest("123456")))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PAY_PASSWORD_MISMATCH);
                    assertThat(ex.getData()).hasFieldOrPropertyWithValue("failCount", 1);
                });
    }

    @Test
    void verifyPayPassword_whenFailureActionRequiresReset_throwsResetException() {
        // given: 정책 서비스가 재인증 필요 상태를 반환한다.
        Long userId = 1L;
        User user = createUser(userId, "encoded-password", 2);
        UserAccount verifiedAccount = createVerifiedAccount(11L, userId, "088", "bank", "123456789012");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(payPasswordSecurityHelper.matches("123456", "encoded-password")).thenReturn(false);
        when(userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(verifiedAccount));
        when(payPasswordStatusService.recordFailure(userId, 11L))
                .thenReturn(new PayPasswordFailureResult(PayPasswordFailureAction.RESET_REQUIRED, 0));

        // when & then: reset 예외를 반환한다.
        assertThatThrownBy(() -> accountService.verifyPayPassword(userId, new VerifyPayPasswordRequest("123456")))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PAY_PASSWORD_RESET);
                });
    }

    @Test
    void verifyPayPassword_whenPayPasswordIsMissing_throwsNotFoundException() {
        // given: 결제 비밀번호가 설정되지 않은 유저가 있다.
        Long userId = 1L;
        User user = createUser(userId, null, 0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // when & then: 비밀번호 미설정 예외를 반환한다.
        assertThatThrownBy(() -> accountService.verifyPayPassword(userId, new VerifyPayPasswordRequest("123456")))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.PAY_PASSWORD_NOT_FOUND);
                });

        verify(payPasswordSecurityHelper, never()).matches(any(), any());
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

    private User createUser(Long id, String payPassword, Integer failCount) {
        return User.builder()
                .id(id)
                .socialId("social-" + id)
                .email("user" + id + "@duckchi.com")
                .name("tester")
                .tag("#AAA")
                .ssafyUserKey("user-key-" + id)
                .payPassword(payPassword)
                .payPasswordFailCnt(failCount)
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
