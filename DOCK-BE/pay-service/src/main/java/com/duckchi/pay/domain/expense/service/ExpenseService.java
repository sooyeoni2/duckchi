package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import java.util.List;

public interface ExpenseService {

    List<AccountHistoryResponse> getAccountHistory(Long userId, AccountHistoryRequest request);

    List<ExpenseParticipantOptionResponse> getExpenseParticipants(Long userId, Long roomId);

    Long registerExpense(Long userId, Long roomId, ExpenseUpsertRequest request);

    List<ExpenseResponse> getExpensesByRoom(Long roomId);

    List<ExpenseResponse> getMyExpensesByRoom(Long userId, Long roomId);

    ExpenseDetailResponse getExpenseDetail(Long roomId, Long expenseId);

    void deleteExpense(Long userId, Long roomId, Long expenseId);

    void updateExpense(Long userId, Long roomId, Long expenseId, ExpenseUpsertRequest request);
}
