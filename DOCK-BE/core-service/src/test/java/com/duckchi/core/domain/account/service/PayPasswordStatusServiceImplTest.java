package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.PayPasswordFailureAction;
import com.duckchi.core.domain.account.type.PayPasswordFailureResult;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayPasswordStatusServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private PayPasswordStatusServiceImpl payPasswordStatusService;

    @Test
    void recordFailure_whenFailCountIsBelowThree_returnsMismatchAndIncreasesCount() {
        // given: 실패 횟수가 아직 3회 미만인 유저와 인증 완료 계좌가 존재한다.
        Long userId = 1L;
        Long accountId = 10L;
        User user = createUser(userId, "encoded-pay-password", 0);
        UserAccount userAccount = createVerifiedAccount(accountId, userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(userAccount));

        // when: 실패 횟수를 기록한다.
        PayPasswordFailureResult result = payPasswordStatusService.recordFailure(userId, accountId);

        // then: 횟수는 1 증가하고 mismatch 결과를 반환한다.
        assertThat(result.action()).isEqualTo(PayPasswordFailureAction.MISMATCH);
        assertThat(result.failCount()).isEqualTo(1);
        assertThat(user.getPayPasswordFailCnt()).isEqualTo(1);
        assertThat(user.getPayPassword()).isEqualTo("encoded-pay-password");
        assertThat(userAccount.getDeletedAt()).isNull();
    }

    @Test
    void recordFailure_whenFailCountReachesThree_resetsPasswordAndSoftDeletesAccount() {
        // given: 이번 실패로 3회에 도달하는 유저와 인증 완료 계좌가 존재한다.
        Long userId = 1L;
        Long accountId = 10L;
        User user = createUser(userId, "encoded-pay-password", 2);
        UserAccount userAccount = createVerifiedAccount(accountId, userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.of(userAccount));

        // when: 실패 횟수를 기록한다.
        PayPasswordFailureResult result = payPasswordStatusService.recordFailure(userId, accountId);

        // then: 비밀번호와 실패 횟수가 초기화되고 계좌는 soft delete 된다.
        assertThat(result.action()).isEqualTo(PayPasswordFailureAction.RESET_REQUIRED);
        assertThat(result.failCount()).isZero();
        assertThat(user.getPayPassword()).isNull();
        assertThat(user.getPayPasswordFailCnt()).isZero();
        assertThat(userAccount.getDeletedAt()).isNotNull();
    }

    @Test
    void recordFailure_whenUserDoesNotExist_throwsUnauthorizedException() {
        // given: 요청 유저가 존재하지 않는다.
        Long userId = 1L;
        Long accountId = 10L;

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // when & then: 인증 예외를 반환한다.
        assertThatThrownBy(() -> payPasswordStatusService.recordFailure(userId, accountId))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.AUTH_UNAUTHORIZED);
                });
    }

    @Test
    void recordFailure_whenVerifiedAccountDoesNotExist_throwsAccountInvalidException() {
        // given: 유저는 존재하지만 인증 완료 계좌가 없다.
        Long userId = 1L;
        Long accountId = 10L;
        User user = createUser(userId, "encoded-pay-password", 0);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED))
                .thenReturn(Optional.empty());

        // when & then: 계좌 관련 예외를 반환한다.
        assertThatThrownBy(() -> payPasswordStatusService.recordFailure(userId, accountId))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_INVALID);
                });
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

    private UserAccount createVerifiedAccount(Long id, Long userId) {
        return UserAccount.builder()
                .id(id)
                .userId(userId)
                .bankCode("088")
                .bankName("bank")
                .accountNumber("123456789012")
                .status(AccountStatus.VERIFIED)
                .registeredAt(LocalDateTime.now().minusDays(1))
                .authRequestedAt(LocalDateTime.now().minusDays(1))
                .build();
    }
}
