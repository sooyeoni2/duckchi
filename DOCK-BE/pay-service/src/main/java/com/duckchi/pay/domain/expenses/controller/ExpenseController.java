package com.duckchi.pay.domain.expenses.controller;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.service.ExpenseService;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 결제 관리 컨트롤러.
 */
@Tag(name = "Expense", description = "결제 및 지출 내역 관리 API")
@RestController
@RequestMapping("/api/v1") // 공통 베이스 경로만 지정함.
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 계좌 거래 내역 조회 API (PAY-01).
     * 
     * [설계 의도] 
     * 특정 방에 소속되지 않은 독립적인 금융 조회 기능이므로 /expenses 경로를 사용함.
     */
    @Operation(summary = "계좌 거래 내역 조회", description = "보안을 위해 POST 방식으로 데이터를 전달받아 금융망 내역을 조회함.")
    @PostMapping("/expenses/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @RequestBody @Valid AccountHistoryRequest request
    ) {
        String tempUserKey = "06ac95e7-e593-4f3f-8cc6-7f5d4ff47400";
        List<AccountHistoryResponse> response = expenseService.getAccountHistory(request, tempUserKey);
        return ApiResponseDto.success(response);
    }

    /**
     * 결제 통합 등록 API (PAY-04).
     * 
     * [설계 의도]
     * 특정 모임방의 리소스로서 결제를 저장하므로 /rooms/{roomId}/expenses 경로를 사용함.
     */
    @Operation(summary = "결제 통합 등록", description = "N빵 또는 메뉴별 상세 정산 내역을 통합하여 저장함.")
    @PostMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<Long> registerExpense(
            @PathVariable Long roomId,
            @RequestBody @Valid ExpenseRegistrationRequest request
    ) {
        Long expenseId = expenseService.registerExpense(request);
        return ApiResponseDto.success(expenseId);
    }
}
