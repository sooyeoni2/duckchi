package com.duckchi.pay.domain.settlement.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SettlementManualTransferRequest(
        @NotNull(message = "settlementId는 필수입니다.")
        @Positive(message = "settlementId는 1 이상이어야 합니다.")
        Long settlementId
) {
}