package com.duckchi.pay.infra.finance;

import com.duckchi.pay.infra.finance.dto.request.TransactionHistoryRequest;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 외부 금융 시스템 통신 전용 클라이언트 인터페이스.
 */
@FeignClient(
    name = "finance-client", 
    url = "${finance.api.base-url}", 
    path = "/ssafy/api/v1/edu/demandDeposit" 
)
public interface FinanceClient {

    /**
     * 계좌 거래 내역 실시간 조회함.
     */
    @PostMapping("/inquireTransactionHistoryList")
    TransactionHistoryResponse fetchTransactionHistory(@RequestBody TransactionHistoryRequest request);
}
