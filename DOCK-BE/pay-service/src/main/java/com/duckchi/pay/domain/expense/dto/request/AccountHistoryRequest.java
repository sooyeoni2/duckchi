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

    @Schema(
            description = "캐시 무시 및 최신 내역 강제 조회 여부. true일 경우 외부 금융망 API를 직접 호출함",
            example = "false"
    )
    private Boolean refresh;

    public boolean isRefresh() {
        return refresh != null && refresh;
    }
}
