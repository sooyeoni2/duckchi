package com.duckchi.core.domain.account.service;

import com.duckchi.core.domain.account.dto.response.PayPasswordFailResponse;
import com.duckchi.core.domain.account.entity.UserAccount;
import com.duckchi.core.domain.account.repository.UserAccountRepository;
import com.duckchi.core.domain.account.type.AccountStatus;
import com.duckchi.core.domain.account.type.PayPasswordFailureAction;
import com.duckchi.core.domain.account.type.PayPasswordFailureResult;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PayPasswordStatusServiceImpl implements PayPasswordStatusService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    //pay password 실패 시 동작할 별도 트랜잭션 서비스
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PayPasswordFailureResult recordFailure(Long userId, Long accountId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.AUTH_UNAUTHORIZED));

        UserAccount userAccount = userAccountRepository
                .findByIdAndUserIdAndStatusAndDeletedAtIsNull(accountId, userId, AccountStatus.VERIFIED)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCOUNT_INVALID));
        //실패 횟수 1회 추가
        user.increasePayPasswordFailCnt();
        //비밀번호 실패 횟수 3회 초과일 경우
        if(user.getPayPasswordFailCnt() >= 3){
            user.updatePayPassword(null); //결제 비밀번호 초기화
            user.resetPayPasswordFailCnt(); //결제 비밀번호 실패 횟수 초기화
            userAccount.softDelete(); //계좌 삭제
            return new PayPasswordFailureResult(PayPasswordFailureAction.RESET_REQUIRED,user.getPayPasswordFailCnt());
        }
        return new PayPasswordFailureResult(PayPasswordFailureAction.MISMATCH,user.getPayPasswordFailCnt());
    }
}
