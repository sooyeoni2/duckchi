package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expenses.dto.response.ExpenseResponse;
import java.util.List;

/**
 * 결제 관리 서비스 인터페이스.
 */
public interface ExpenseService {

    /**
     * 외부 금융망으로부터 계좌 내역을 조회함.
     */
    List<AccountHistoryResponse> getAccountHistory(AccountHistoryRequest request, String userKey);

    /**
     * 결제 내역 및 정산 참여자 정보를 등록함 (PAY-04).
     */
    Long registerExpense(ExpenseRegistrationRequest request);

    /**
     * 특정 모임방의 결제 내역 목록을 조회함 (PAY-05).
     */
    List<ExpenseResponse> getExpensesByRoom(Long roomId);

    /**
     * 결제 내역 상세 정보를 조회함 (PAY-05-Detail).
     */
    ExpenseDetailResponse getExpenseDetail(Long roomId, Long expenseId);

    /**
     * 결제 내역을 삭제함 (PAY-06).
     */
    void deleteExpense(Long roomId, Long expenseId);

    /**
     * 결제 내역을 수정함 (전체 덮어쓰기 방식).
     * 
     * @param roomId 모임방 식별자임.
     * @param expenseId 수정할 결제 식별자임.
     * @param request 수정된 결제 및 참여자 정보임.
     */
    void updateExpense(Long roomId, Long expenseId, ExpenseRegistrationRequest request);
}
