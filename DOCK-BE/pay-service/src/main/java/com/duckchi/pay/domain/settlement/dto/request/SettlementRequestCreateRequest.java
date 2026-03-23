package com.duckchi.pay.domain.settlement.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;

public record SettlementRequestCreateRequest(
        @NotEmpty(message = "requestedExpenseIds는 비어 있을 수 없습니다.")
        List<@NotNull(message = "정산 요청 ID는 null일 수 없습니다.") @Positive(message = "정산 요청 ID는 1 이상이어야 합니다.") Long> requestedExpenseIds
) {
}
