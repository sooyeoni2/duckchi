package com.duckchi.pay.domain.expenses.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 결제 내역 요약 응답.
 * 목록 조회 시 필요한 핵심 필드만 포함함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제 내역 요약 정보")
public class ExpenseResponse {

    @Schema(description = "결제 식별자", example = "1")
    private Long expenseId;

    @Schema(description = "모임 회차 식별자", example = "1")
    private Long roomSessionId;

    @Schema(description = "결제 제목 (가맹점명 등)", example = "한우마당")
    private String title;

    @Schema(description = "총 결제 금액", example = "120000")
    private Integer totalAmount;

    @Schema(description = "결제자(총무) 이름", example = "강산천")
    private String payerUserName;

    @Schema(description = "입력 방식 (MANUAL, ACCOUNT_HISTORY, OCR)", example = "ACCOUNT_HISTORY")
    private String inputType;

    @Schema(description = "결제안 상태 (PENDING, REQUESTED, SETTLED)", example = "PENDING")
    private String status;

    @Schema(description = "실제 결제 일시", example = "2026-03-12T14:30:00")
    private LocalDateTime paidAt;

    @Schema(description = "결제안 등록 일시", example = "2026-03-13T10:00:00")
    private LocalDateTime createdAt;
}
