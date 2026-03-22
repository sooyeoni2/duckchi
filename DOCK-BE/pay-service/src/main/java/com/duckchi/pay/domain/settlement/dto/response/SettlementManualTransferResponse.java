package com.duckchi.pay.domain.settlement.dto.response;

import java.time.LocalDateTime;

public record SettlementManualTransferResponse(
        Long settlementId,
        Long expenseId,
        String settlementStatus,
        String expenseStatus,
        LocalDateTime completedAt
) {
}