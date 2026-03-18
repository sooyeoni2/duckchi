package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 계좌 거래 내역 응답 (내부용)
 * 프론트엔드에 전달할 가공된 데이터 구조임.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 정보")
public class AccountHistoryResponse {

    @Schema(description = "거래 명(가맹점명 등)", example = "한우마당")
    private String transactionMemo;

    @Schema(description = "거래 금액", example = "120000")
    private Integer amount;

    @Schema(description = "거래 일시", example = "2026-03-12T14:00:00")
    private LocalDateTime transactionAt;

    @Schema(description = "상대 계좌 번호", example = "123-456-789")
    private String counterAccountNo;
}
