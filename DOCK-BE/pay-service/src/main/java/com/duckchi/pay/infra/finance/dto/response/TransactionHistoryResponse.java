package com.duckchi.pay.infra.finance.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

/**
 * 외부 금융망 거래 내역 조회 응답 전문 (Transaction History Response).
 * 
 * [설계 의도]
 * 1. 구조적 응답 처리: Header와 실제 데이터 본문(REC)을 명확히 분리하여 처리함.
 * 2. 데이터 보존: 금융망에서 전달하는 모든 원천 데이터를 String 형태로 누락 없이 수신함.
 * 
 * [기술적 특이사항]
 * - @JsonProperty("REC"): 외부 API의 대문자 규격에 맞춘 필드 매핑임.
 * - 내부 정적 클래스 활용: 응답 본문 내에서만 유효한 상세 구조를 캡슐화함.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponse {
    
    @JsonProperty("Header") 
    private FinanceResponseHeader header;

    /**
     * 거래 결과 데이터 본문.
     * REC는 Record의 약자로 금융권에서 주로 사용하는 데이터 셋 명칭임.
     */
    @JsonProperty("REC") 
    private TransactionResultBody rec;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionResultBody {
        private String totalCount;     // 검색된 전체 내역 건수임.
        private List<TransactionDetail> list; // 실제 거래 상세 데이터 리스트임.
    }

    /**
     * 상세 거래 데이터 규격.
     * 주의: 모든 금액 및 시각 정보는 외부 서버 규격에 따라 String으로 수신되며, 
     * 이후 서비스 레이어에서 비즈니스 타입(Integer, LocalDateTime)으로 가공됨.
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionDetail {
        private String transactionUniqueNo;  // 거래 고유 일련번호임.
        private String transactionDate;      // 거래 발생 일자 (YYYYMMDD)임.
        private String transactionTime;      // 거래 발생 시각 (HHMMSS)임.
        private String transactionType;      // 유형 코드 (1:입금, 2:출금)임.
        private String transactionTypeName;  // 유형 명칭 (입금/출금 등)임.
        private String transactionAccountNo; // 상대방 계좌번호임.
        private String transactionBalance;   // 거래된 금액 (원 단위)임.
        private String transactionAfterBalance; // 거래 후 최종 잔액임.
        private String transactionSummary;   // 거래 적용(기본 메모)임.
        private String transactionMemo;      // 추가 거래 메모임.
    }
}
