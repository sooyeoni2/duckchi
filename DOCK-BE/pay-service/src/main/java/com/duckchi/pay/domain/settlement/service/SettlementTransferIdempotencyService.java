package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.dto.request.FinanceRequestHeader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class SettlementTransferIdempotencyService {

    private final SettlementRepository settlementRepository;

    /**
     * SET-02 재시도에서도 동일 송금 요청키를 재사용할 수 있도록 settlement에 선저장한다.
     * 별도 트랜잭션으로 먼저 커밋해, 외부 호출 타임아웃/예외가 나도 키가 유실되지 않게 보장한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String ensureFinanceRequestUniqueNo(Long settlementId) {
        Settlement settlement = settlementRepository.findByIdForUpdate(settlementId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_NOT_FOUND));

        if (StringUtils.hasText(settlement.getFinanceRequestUniqueNo())) {
            return settlement.getFinanceRequestUniqueNo();
        }

        String financeRequestUniqueNo = FinanceRequestHeader.generateInstitutionTransactionUniqueNo();
        settlement.assignFinanceRequestUniqueNo(financeRequestUniqueNo);
        settlementRepository.flush();

        return financeRequestUniqueNo;
    }
}