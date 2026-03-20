package com.duckchi.pay.domain.expense.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 계좌 거래 내역 조회 요청 DTO.
 * 로그인 사용자 대표 계좌 재검증 목적의 선택 필드 포함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 조회 요청")
public class AccountHistoryRequest {

    @Schema(
            description = "검증 대상 계좌번호. 값이 있으면 로그인 사용자 대표 계좌와 일치 여부 검증",
            example = "1234567890123456"
    )
    private String accountNo;
}
