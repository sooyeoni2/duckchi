package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import java.util.List;

/**
 * 결제 관리 서비스 인터페이스
 * 비즈니스 로직의 추상화 계층임.
 */
public interface ExpenseService {

    /**
     * 외부 금융망으로부터 계좌 내역을 조회하고 내부 규격으로 가공함.
     * 
     * @param accountNo 조회할 계좌 번호임.
     * @param userKey 사용자의 금융망 식별키임.
     * @return 가공된 거래 내역 리스트임.
     */
    List<AccountHistoryResponse> getAccountHistory(String accountNo, String userKey);
}
