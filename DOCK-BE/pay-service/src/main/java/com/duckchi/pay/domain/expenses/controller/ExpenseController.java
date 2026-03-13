package com.duckchi.pay.domain.expenses.controller;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
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
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 계좌 거래 내역 조회 API (PAY-01).
     * 
     * @param request 조회 정보를 담은 요청 객체임.
     * @param userKey 사용자의 금융망 고유 키임.
     * @return 가공된 최근 거래 내역 리스트임.
     */
    @Operation(summary = "계좌 거래 내역 조회", description = "보안을 위해 POST 방식으로 데이터를 전달받아 금융망 내역을 조회함.")
    @PostMapping("/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @RequestBody @Valid AccountHistoryRequest request
    ) {
        // TODO: JWT 인증 구현 완료 후 SecurityContext에서 userId 추출함.
        // TODO: 추출된 userId를 기반으로 DB(또는 Core 서비스 호출)에서 해당 유저의 ssafy_user_key를 조회해와야 함.
        String tempUserKey = "your-actual-user-key-here"; // 임시 하드코딩함.

        List<AccountHistoryResponse> response = expenseService.getAccountHistory(request, tempUserKey);
        return ApiResponseDto.success(response);
    }
}
