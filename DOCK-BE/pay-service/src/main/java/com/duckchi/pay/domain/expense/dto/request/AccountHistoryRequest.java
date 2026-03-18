package com.duckchi.pay.domain.expense.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 계좌 거래 내역 조회 요청 DTO이다.
 * 현재 계좌번호는 core-service에서 로그인 사용자 기준으로 다시 조회하며,
 * 본 필드는 기존 클라이언트와의 호환성을 위해 선택적으로 유지한다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 조회 요청")
public class AccountHistoryRequest {

    @Schema(
            description = "레거시 호환용 계좌번호이다. 값이 들어오면 로그인 사용자의 인증 계좌와 일치하는지 검증한다.",
            example = "1234567890123456"
    )
    private String accountNo;
}
