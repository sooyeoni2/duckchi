package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.badge.dto.request.BadgeCheckRequest;
import com.duckchi.core.domain.badge.enums.BadgeEventType;
import com.duckchi.core.domain.badge.service.BadgeCheckService;
import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.SetPayPasswordRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.request.VerifyPayPasswordRequest;
import com.duckchi.core.domain.account.dto.response.AccountLockInfoResponse;
import com.duckchi.core.domain.account.dto.response.PayPasswordFailResponse;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.BankCode;
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
import com.duckchi.core.infra.finance.dto.request.OpenAccountAuthRequest;
import com.duckchi.core.infra.finance.dto.response.CheckAuthCodeResponse;
import com.duckchi.core.infra.redis.OneVerifyRedisRepository;
import com.duckchi.core.infra.redis.dto.OneVerifyCacheEntry;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;


@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AccountServiceImpl implements AccountService {

    private final UserRepository userRepository;
    private static final String AUTH_TEXT = "SSAFY";
    private final AccountStatusService accountStatusService;
    private final PayPasswordStatusService payPasswordStatusService;
    private final UserAccountRepository userAccountRepository;
    private final OneVerifyRedisRepository oneVerifyRedisRepository;
    private final FinanceClient financeClient;
    private final OneVerifyHeaderFactory oneVerifyHeaderFactory;
    private final FinanceExceptionParser financeExceptionParser;
    private final PayPasswordSecurityHelper payPasswordSecurityHelper;
    private final BadgeCheckService badgeCheckService;

    //계좌 등록
    @Override
    public RegisterBankAccountResponse registerBankAccount(Long userId, RegisterBankAccountRequest request) {
        //계좌가 이미 등록되어있는지 확인
        if (userAccountRepository.existsByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED)) {
            throw new CustomException(ErrorCode.ACCOUNT_USER_ALREADY_REGISTERD);
        }

        //이미 pending인 계좌가 있다면 만료처리 + redis key 삭제
        userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.PENDING)
                .ifPresent(userAccount -> {
                    userAccount.expire();
                    oneVerifyRedisRepository.delete(userAccount.getId());
                });
        //request에서 은행코드 가져오기
        BankCode bankCode = BankCode.from(request.bankCode());

        //LOCKED 처리된 계좌번호와 은행번호라면 예외 반환하기
        userAccountRepository
                .findByUserIdAndBankCodeAndAccountNumberAndStatusAndDeletedAtIsNull(
                        userId,
                        bankCode.getCode(),
                        request.accountNo(),
                        AccountStatus.LOCKED
                )
                .ifPresent(lockedAccount -> {
                    long remainingSeconds = oneVerifyRedisRepository.getRemainingLockSeconds(lockedAccount.getId());
                    LocalDateTime lockedUntil = LocalDateTime.now().plusSeconds(remainingSeconds);

                    AccountLockInfoResponse data = new AccountLockInfoResponse(lockedUntil);

                    throw new CustomException(
                            ErrorCode.ACCOUNT_VERIFICATION_LOCKED,
                            data
                    );
                });
        try {
            //DB에 유저계좌정보 저장하기
            UserAccount userAccount = userAccountRepository.save(
                    UserAccount.builder()
                            .userId(userId)
                            .bankCode(bankCode.getCode())
                            .bankName(bankCode.getBankName())
                            .accountNumber(request.accountNo())
                            .status(AccountStatus.PENDING)
                            .authRequestedAt(LocalDateTime.now())
                            .build()
            );
            //1원 송금 + Redis Pending 저장
            sendOneWon(userAccount,userId);

            //DB에 등록한 계좌 정보 response로 반환
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

    //1원 송금 + Redis Pending 저장 (두 동작은 종속된 동작이므로)
    @Override
    public void sendOneWon(UserAccount userAccount,Long userId) {
        User user = getUser(userId);
        String SSAFY_USER_KEY = user.getSsafyUserKey();
        OpenAccountAuthRequest financeRequest = new OpenAccountAuthRequest(
                oneVerifyHeaderFactory.create("openAccountAuth", SSAFY_USER_KEY),
                userAccount.getAccountNumber(),
                AUTH_TEXT
        );
        try {
            financeClient.openAccountAuth(financeRequest);
            oneVerifyRedisRepository.savePending(userAccount.getId(), userAccount.getUserId(), userAccount.getAccountNumber(), Duration.ofMinutes(5));
        } catch (CustomException ex) {
            throw ex;
        } catch (FeignException ex) {
            throw financeExceptionParser.parseOpenAccountAuthException(ex);
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    //1원 송금 검증
    @Override
    public VerifyOneWonResponse verifyOneWon(Long userId, Long accountId, VerifyOneWonRequest request) {
        User user = getUser(userId);
        String SSAFY_USER_KEY = user.getSsafyUserKey();
        //UserAccount 가져오기
        UserAccount userAccount = userAccountRepository
                .findByIdAndUserIdAndDeletedAtIsNull(accountId,userId)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        //이미 인증된 계좌인지 확인
        if (userAccount.getStatus() == AccountStatus.VERIFIED) {
            throw new CustomException(ErrorCode.ACCOUNT_ALREADY_REGISTERED);
        }

        //만료된 계좌인지 확인
        if (userAccount.getStatus() == AccountStatus.EXPIRED) {
            throw new CustomException(ErrorCode.ACCOUNT_AUTH_CODE_EXPIRED);
        }
        //상태가 PENDING인지 확인
        if (userAccount.getStatus() != AccountStatus.PENDING) {
            throw new CustomException(ErrorCode.ACCOUNT_INVALID);
        }
        //Redis에서 인증 상태 조회
        OneVerifyCacheEntry cache = oneVerifyRedisRepository.find(accountId)
                .orElseThrow(() -> {
                    accountStatusService.markExpired(accountId); //DB에 EXPIRED 처리 (롤백되어도 상태 저장 가능)
                    return new CustomException(ErrorCode.ACCOUNT_AUTH_CODE_EXPIRED);
                }); //key가 없음 = 5분 TTL 만료

        //LOCKED 상태면 차단
        if(cache.isLocked()){
            throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_LOCKED);
        }

        //금융망 1원 송금 검증 api 호출 request 생성
        CheckAuthCodeRequest financeRequest = new CheckAuthCodeRequest(
                oneVerifyHeaderFactory.create("checkAuthCode", SSAFY_USER_KEY),
                userAccount.getAccountNumber(),
                AUTH_TEXT,
                request.verificationCode()
        );

        try {
            //금융망 1원 송금 검증 api 호출
            CheckAuthCodeResponse financeResponse;
            //먼저 FeignException 잡아서 알맞은 CustomException으로 던져주기
            try{
                financeResponse = financeClient.checkAuthCode(financeRequest);
            }catch(FeignException ex){
                throw financeExceptionParser.parseCheckAuthCodeException(ex);
            }

            if (financeResponse.rec() == null || !"SUCCESS".equalsIgnoreCase(financeResponse.rec().status())) {
                throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
            }
             //userAccount 검증 처리
            userAccount.verify();
            oneVerifyRedisRepository.delete(accountId);

            // [BADGE 트리거] 계좌 등록 완료 시 뱃지 진행도 갱신 (MANSOUR_DUCK)
            // Core 서비스 내부 호출이므로 직접 BadgeCheckService를 호출한다.
            int totalAccounts = (int) userAccountRepository.countByUserIdAndStatusAndDeletedAtIsNull(userId, AccountStatus.VERIFIED);
            badgeCheckService.checkAndAwardBadges(BadgeCheckRequest.builder()
                    .userId(userId)
                    .eventType(BadgeEventType.ACCOUNT_REGISTERED)
                    .totalAccounts(totalAccounts)
                    .build());

            return new VerifyOneWonResponse(userAccount.getId(), true);
        } catch (CustomException ex) {
            //인증 코드가 틀렸거나, 유효하지 않은 값이면 실패 횟수 1회 증가
            if (ex.getErrorCode() == ErrorCode.ACCOUNT_AUTH_CODE_MISMATCH
                    || ex.getErrorCode() == ErrorCode.ACCOUNT_AUTH_CODE_INVALID) {

                int failCount = oneVerifyRedisRepository.increaseFailCount(accountId);

                if (failCount >= 3) {
                    oneVerifyRedisRepository.lock(accountId, Duration.ofHours(24));
                    accountStatusService.markLocked(accountId); //DB에 LOCKED 처리 (롤백되어도 상태 저장 가능)
                    long remainingSeconds = oneVerifyRedisRepository.getRemainingLockSeconds(accountId);
                    LocalDateTime lockedUntil = LocalDateTime.now().plusSeconds(remainingSeconds);
                    AccountLockInfoResponse data = new AccountLockInfoResponse(lockedUntil);
                    throw new CustomException(ErrorCode.ACCOUNT_VERIFICATION_LOCKED,data);
                }

                throw new CustomException(
                  String.format("현재 %d회 실패했습니다. 3회 실패 시 24시간 동안 이 계좌의 인증이 잠깁니다.",failCount),
                        ex.getErrorCode()
                );
            }
            throw ex;
        } catch (Exception ex) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    //결제 비밀번호 설정
    @Override
    public void setPayPassword(Long userId, SetPayPasswordRequest request) {
        //유저 가져오기
        User user = getUser(userId);
        //이미 비밀번호가 설정되었는지 확인
        if (user.hasPayPassword()){
            throw new CustomException(ErrorCode.PAY_PASSWORD_ALREADY_SET);
        }
        //비밃번호 암호화
        String encodedPassword = payPasswordSecurityHelper.encode(request.password());
        //비밀번호 설정
        user.updatePayPassword(encodedPassword);
    }

    //결제 비밀번호 검증
    @Override
    @Transactional
    public void verifyPayPassword(Long userId, VerifyPayPasswordRequest request) {
        //유저 가져오기
        User user = getUser(userId);
        //결제 비밀번호가 설정되지 않은 경우
        if (!user.hasPayPassword()) {
            throw new CustomException(ErrorCode.PAY_PASSWORD_NOT_FOUND);
        }
        //encoding된 비밀번호랑 매치되는지 확인
        boolean matched = payPasswordSecurityHelper.matches(
                request.password(),
                user.getPayPassword()
        );

        //결제 비밀번호 검증
        if(matched) {
            user.resetPayPasswordFailCnt();
            return;
        } else {
            UserAccount userAccount = userAccountRepository.findByUserIdAndStatusAndDeletedAtIsNull(userId,AccountStatus.VERIFIED)
                    .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));
            PayPasswordFailureResult result = payPasswordStatusService.recordFailure(userId,userAccount.getId());
            //결제 비밀번호 실패 횟수 data에 담기
            PayPasswordFailResponse data = new PayPasswordFailResponse(result.failCount());
            if (result.action() == PayPasswordFailureAction.RESET_REQUIRED){
                throw new CustomException(ErrorCode.PAY_PASSWORD_RESET);
            }
            throw new CustomException(ErrorCode.PAY_PASSWORD_MISMATCH,data);
        }
    }

    //계좌 삭제
    @Override
    public void deleteBankAccount(Long userId, Long accountId) {
        UserAccount userAccount = userAccountRepository.findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId,userId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));

        userAccount.softDelete();
    }


    //계좌번호 마스킹
    private String maskAccountNumber(String accountNumber) {
        int visibleLength = Math.min(4, accountNumber.length());
        return accountNumber.substring(0, visibleLength) + "*".repeat(accountNumber.length() - visibleLength);
    }

    //유저 찾기
    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_UNAUTHORIZED));
    }

}
