package com.duckchi.pay.infra.client;

import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 외부 금융 시스템 통신 전용 클라이언트 인터페이스.
 * 
 * [Path 설정 이유]
 * SSAFY 금융망 API 가이드에 따라 수시입출금 도메인의 공통 경로를 상단에 정의함.
 * - 수시입출금: /ssafy/api/v1/edu/demandDeposit
 * - 예적금: /ssafy/api/v1/edu/deposit
 * - 카드: /ssafy/api/v1/edu/creditCard
 * 위와 같이 도메인별로 공통 경로가 나뉘어 있으므로, 현재 클라이언트는 수시입출금 전용으로 설정함.
 */
@FeignClient(
    name = "finance-client", 
    url = "${finance.api.base-url}", 
    path = "/ssafy/api/v1/edu/demandDeposit" 
)
public interface FinanceClient {

    /**
     * 계좌 거래 내역 실시간 조회함.
     * 엔드포인트: {base-url}/{path}/inquireTransactionHistoryList
     * 
     * @param request 보안 헤더와 계좌 정보, 조회 기간 포함함.
     * @return 거래 내역 결과 본문(REC) 포함한 응답 객체임.
     */
    @PostMapping("/inquireTransactionHistoryList")
    TransactionHistoryResponse fetchTransactionHistory(@RequestBody TransactionHistoryRequest request);

    /* 
     * [참고: 향후 추가될 수 있는 수시입출금 API 목록]
     * - 계좌 잔액 조회: /inquireDemandDepositAccountBalance
     * - 계좌 이체: /updateDemandDepositAccountTransfer
     * - 예금주 조회: /inquireDemandDepositAccountHolderName
     */
}
