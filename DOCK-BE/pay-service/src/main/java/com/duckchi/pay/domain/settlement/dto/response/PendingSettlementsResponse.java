package com.duckchi.pay.domain.settlement.dto.response;

import java.util.List;

/**
 * SET-04에서 특정 결제의 정산 진행 현황(집계 + 상세 목록)을 내려주는 응답 모델이다.
 */
public record PendingSettlementsResponse(
        Long expenseId,
        Long roomId,
        String roomName,
        Long requesterUserId,
        String requesterUserName,
        Integer totalPayableAmount,
        int pendingCount,
        int completedCount,
        List<PendingSettlementItemResponse> settlements
) {
}