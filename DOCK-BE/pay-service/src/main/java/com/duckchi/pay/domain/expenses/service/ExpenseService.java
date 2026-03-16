package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import java.util.List;

/**
 * 결제 관리 서비스 인터페이스.
 */
public interface ExpenseService {

    /**
     * 외부 금융망으로부터 계좌 내역을 조회함.
     * 
     * @param request 계좌번호 및 조회 정책을 담은 요청 객체임.
     * @param userKey 사용자의 금융망 식별키임.
     * @return 가공된 거래 내역 리스트임.
     */
    List<AccountHistoryResponse> getAccountHistory(AccountHistoryRequest request, String userKey);

    /**
     * 결제 내역 및 정산 참여자 정보를 등록함 (PAY-04).
     * 
     * @param request 결제 원장, 품목 상세, 참여자별 분담금 포함된 객체임.
     * @return 생성된 결제 내역의 식별자임.
     */
    Long registerExpense(ExpenseRegistrationRequest request);
}
