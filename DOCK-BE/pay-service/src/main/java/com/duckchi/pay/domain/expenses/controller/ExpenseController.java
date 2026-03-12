package com.duckchi.pay.domain.expenses.controller;

import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.service.ExpenseService;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결제 관리 컨트롤러.
 * 프론트엔드의 결제 관련 요청을 처리하는 최전방 계층임.
 */
@Tag(name = "Expense", description = "결제 및 지출 내역 관리 API")
@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 계좌 거래 내역 조회 API (PAY-01).
     * 
     * @param accountNo 조회 대상 계좌 번호임.
     * @param userKey 사용자의 금융망 고유 키임. (임시로 헤더에서 수신함)
     * @return 가공된 최근 거래 내역 리스트임.
     */
    @Operation(summary = "계좌 거래 내역 조회", description = "금융망으로부터 특정 계좌의 최근 입금(D) 거래 내역을 가져옴.")
    @GetMapping("/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @RequestParam String accountNo,
            @RequestHeader("X-User-Key") String userKey 
    ) {
        List<AccountHistoryResponse> response = expenseService.getAccountHistory(accountNo, userKey);
        return ApiResponseDto.success(response);
    }
}
