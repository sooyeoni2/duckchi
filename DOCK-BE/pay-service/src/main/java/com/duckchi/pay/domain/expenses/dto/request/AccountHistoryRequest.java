package com.duckchi.pay.domain.expenses.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 계좌 거래 내역 조회 요청.
 * 사용자는 계좌번호만 전달하며, 조회 기간은 서버에서 자동으로 최근 7일로 설정함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 조회 요청")
public class AccountHistoryRequest {

    @NotBlank(message = "계좌번호는 필수입니다.")
    @Schema(description = "조회 대상 계좌 번호", example = "1234567890123456")
    private String accountNo;
}
