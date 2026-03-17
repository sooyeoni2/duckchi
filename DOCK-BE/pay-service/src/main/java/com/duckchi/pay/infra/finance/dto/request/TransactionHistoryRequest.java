package com.duckchi.pay.infra.finance.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

/**
 * 외부 금융망 거래 내역 조회 요청 전문 (Transaction History Request).
 * 
 * [설계 의도]
 * 1. 통신 규격 준수: 외부 금융 API의 엄격한 JSON 스펙(대문자 필드 등)을 충족하면서 자바의 네이밍 관례를 유지함.
 * 2. 캡슐화: 보안 헤더와 비즈니스 조회 조건을 하나의 객체로 응집함.
 * 
 * [기술적 특이사항]
 * - POST 조회: 일반적인 REST 관례와 달리 금융망 보안 표준에 따라 조회 요청도 Request Body를 사용하는 POST 방식을 채택함.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryRequest {
    
    /**
     * 공통 보안 헤더.
     * @JsonProperty("Header"): 외부 API 서버가 'Header'라는 대문자 필드명을 요구하므로 명시적으로 매핑함.
     */
    @JsonProperty("Header") 
    private FinanceRequestHeader header;

    @Schema(description = "조회 대상 계좌 번호 (16자리)", example = "1234567890123456")
    private String accountNo;

    @Schema(description = "조회 시작일 (YYYYMMDD)", example = "20260301")
    private String startDate;

    @Schema(description = "조회 종료일 (YYYYMMDD)", example = "20260317")
    private String endDate;

    /**
     * 거래 유형 필터링.
     * M: 입금(Deposit), D: 출금(Withdrawal), A: 전체(All)임.
     */
    private String transactionType;

    /**
     * 데이터 정렬 순서.
     * ASC: 오름차순, DESC: 내림차순임.
     */
    private String orderByType;
}
