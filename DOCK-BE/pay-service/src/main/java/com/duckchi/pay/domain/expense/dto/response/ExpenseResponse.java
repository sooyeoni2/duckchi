package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 결제안 목록 응답 DTO.
 * 목록 화면에서 필요한 요약 정보만 포함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제안 목록 요약 정보")
public class ExpenseResponse {

    @Schema(description = "결제안 식별자", example = "10")
    private Long expenseId;

    @Schema(description = "모임 회차 식별자", example = "1")
    private Long roomSessionId;

    @Schema(description = "결제 제목", example = "강남 저녁 회식")
    private String title;

    @Schema(description = "총 결제 금액", example = "86000")
    private Integer totalAmount;

    @Schema(description = "결제자 이름", example = "강산천")
    private String payerUserName;

    @Schema(description = "입력 방식", example = "ACCOUNT_HISTORY", allowableValues = {"MANUAL", "ACCOUNT_HISTORY", "OCR"})
    private String inputType;

    @Schema(description = "결제 상태", example = "PENDING", allowableValues = {"PENDING", "REQUESTED", "SETTLED"})
    private String status;

    @Schema(description = "실제 결제 일시", example = "2026-03-20T19:30:00")
    private LocalDateTime paidAt;

    @Schema(description = "결제안 생성 일시", example = "2026-03-20T19:32:10")
    private LocalDateTime createdAt;
}
