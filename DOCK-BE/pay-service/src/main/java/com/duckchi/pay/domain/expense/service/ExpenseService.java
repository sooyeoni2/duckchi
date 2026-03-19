package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import java.util.List;

/**
 * 결제안 및 계좌 거래 내역 관련 비즈니스 기능을 정의하는 서비스 인터페이스이다.
 */
public interface ExpenseService {

    /**
     * 로그인 사용자의 금융 프로필을 기준으로 계좌 거래 내역을 조회한다.
     */
    List<AccountHistoryResponse> getAccountHistory(Long userId, AccountHistoryRequest request);

    /**
     * 결제안을 등록한다.
     */
    Long registerExpense(Long userId, ExpenseRegistrationRequest request);

    /**
     * 특정 모임방의 결제안 목록을 조회한다.
     */
    List<ExpenseResponse> getExpensesByRoom(Long roomId);

    /**
     * 특정 모임방에서 로그인 사용자가 생성한 결제안 목록을 조회한다.
     */
    List<ExpenseResponse> getMyExpensesByRoom(Long userId, Long roomId);

    /**
     * 결제안 상세 정보를 조회한다.
     */
    ExpenseDetailResponse getExpenseDetail(Long roomId, Long expenseId);

    /**
     * 결제안을 삭제한다.
     */
    void deleteExpense(Long userId, Long roomId, Long expenseId);

    /**
     * 결제안을 수정한다.
     */
    void updateExpense(Long userId, Long roomId, Long expenseId, ExpenseRegistrationRequest request);
}
