package com.duckchi.pay.domain.expense.dto.external;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

/**
 * 외부 금융망 거래 내역 조회 응답 전문.
 * 응답 본문(REC) 및 상세 내역(TransactionDetail) 포함함.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponse {
    @JsonProperty("Header") // JSON 응답의 대문자 Header와 매핑함.
    private FinanceHeader header;

    @JsonProperty("REC")    // JSON 응답의 대문자 REC와 매핑함.
    private TransactionResultBody rec;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionResultBody {
        private String totalCount;     // 검색된 전체 내역 건수임.
        private List<TransactionDetail> list; // 상세 거래 데이터 리스트임.
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionDetail {
        private String transactionDate;      // 거래 발생 일자 (YYYYMMDD)임.
        private String transactionTime;      // 거래 발생 시각 (HHMMSS)임.
        private String transactionType;      // 유형 코드 (1:입금, 2:출금)임.
        private String transactionTypeName;  // 유형 명칭 (입금/출금 등)임.
        private String transactionAccountNo; // 상대방 계좌번호임.
        private String transactionBalance;   // 거래된 금액 (원 단위)임.
        private String transactionAfterBalance; // 거래 후 최종 잔액임.
        private String transactionSummary;   // 적요 및 거래 메모임.
    }
}
