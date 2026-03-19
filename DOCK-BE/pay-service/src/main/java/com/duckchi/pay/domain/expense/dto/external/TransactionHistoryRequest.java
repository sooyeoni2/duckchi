package com.duckchi.pay.domain.expense.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

/**
 * 외부 금융망 거래 내역 조회 요청 전문.
 * 금융 시스템 전문 규격에 맞춰 필드 구성함.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryRequest {
    @JsonProperty("Header") // JSON 변환 시 대문자 Header 유지를 위해 명시함.
    private FinanceHeader header;    // 공통 보안 헤더임.
    private String accountNo;        // 조회 대상 계좌 번호임.
    private String startDate;        // 조회 시작 범위 (YYYYMMDD)임.
    private String endDate;          // 조회 종료 범위 (YYYYMMDD)임.
    private String transactionType;  // 거래 유형 (A:전체, D:입금, W:출금)임.
    private String orderByType;      // 데이터 정렬 방식 (ASC:오름차순, DESC:내림차순)임.
}
