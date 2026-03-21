package com.duckchi.pay.domain.settlement.dto.response;

import java.time.LocalDateTime;

/**
 * SET-04에서 결제별 정산 참여자 상태 행을 내려주는 응답 모델이다.
 */
public record PendingSettlementItemResponse(
        Long settlementId,
        Long payerUserId,
        String payerUserName,
        Integer payableAmount,
        String status,
        LocalDateTime createdAt,
        LocalDateTime completedAt
) {
}