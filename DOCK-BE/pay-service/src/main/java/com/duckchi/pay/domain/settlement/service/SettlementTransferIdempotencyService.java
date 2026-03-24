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
     * settlement 단위 금융 요청 고유번호를 보장한다.
     * - 최초 호출: 고유번호 생성 후 settlement에 저장
     * - 재시도 호출: 기존 저장값 재사용(멱등성 보강)
     * - REQUIRES_NEW로 먼저 커밋해 외부 API 실패 시에도 키 유실을 방지한다.
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