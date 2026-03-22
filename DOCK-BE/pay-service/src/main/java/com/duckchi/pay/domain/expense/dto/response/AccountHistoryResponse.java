package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 계좌 거래 내역 응답 DTO.
 * 결제안 초안 생성에 필요한 최소 거래 정보 제공.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 정보")
public class AccountHistoryResponse {

    @Schema(description = "거래 메모 또는 가맹점명", example = "덕치정육식당")
    private String transactionMemo;

    @Schema(description = "거래 금액", example = "86000")
    private Integer amount;

    @Schema(description = "거래 일시", example = "2026-03-20T19:30:00")
    private LocalDateTime transactionAt;
}
