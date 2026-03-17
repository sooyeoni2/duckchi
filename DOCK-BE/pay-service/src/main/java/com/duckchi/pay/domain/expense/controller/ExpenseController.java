package com.duckchi.pay.domain.expense.controller;

import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.service.ExpenseService;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    /**
     * 계좌 거래 내역 조회 API (PAY-01).
     */
    @Operation(summary = "계좌 거래 내역 조회", description = "보안을 위해 POST 방식으로 데이터를 전달받아 금융망 내역을 조회함.")
    @PostMapping("/expenses/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @RequestBody @Valid AccountHistoryRequest request
    ) {
        String tempUserKey = "your-actual-user-key-here"; 
        List<AccountHistoryResponse> response = expenseService.getAccountHistory(request, tempUserKey);
        return ApiResponseDto.success(response);
    }

    /**
     * 결제 통합 등록 API (PAY-04).
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

    /**
     * 모임방 결제안 목록 조회 API (PAY-05).
     */
    @Operation(summary = "모임방 결제안 목록 조회", description = "특정 모임방에 등록된 모든 결제안을 최신순으로 가져옴.")
    @GetMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<List<ExpenseResponse>> getExpenses(
            @PathVariable Long roomId
    ) {
        List<ExpenseResponse> response = expenseService.getExpensesByRoom(roomId);
        return ApiResponseDto.success(response);
    }

    /**
     * 결제안 상세 조회 API (PAY-05-Detail).
     */
    @Operation(summary = "결제안 상세 조회", description = "특정 결제 건의 상세 내역(품목, 참여자별 금액)을 조회함.")
    @GetMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<ExpenseDetailResponse> getExpenseDetail(
            @PathVariable Long roomId,
            @PathVariable Long expenseId
    ) {
        ExpenseDetailResponse response = expenseService.getExpenseDetail(roomId, expenseId);
        return ApiResponseDto.success(response);
    }

    /**
     * 결제안 삭제 API (PAY-06).
     * 
     * @param roomId 모임방 식별자임.
     * @param expenseId 삭제할 결제 식별자임.
     * @return 삭제 성공 여부 응답임.
     */
    @Operation(summary = "결제안 삭제", description = "특정 결제안을 삭제함. (연관된 정산이 없을 때 권장)")
    @DeleteMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> deleteExpense(
            @PathVariable Long roomId,
            @PathVariable Long expenseId
    ) {
        expenseService.deleteExpense(roomId, expenseId);
        return ApiResponseDto.success("결제안이 성공적으로 삭제되었습니다.");
    }

    /**
     * 결제안 수정 API (전체 덮어쓰기).
     * 
     * @param roomId 모임방 식별자임.
     * @param expenseId 수정할 결제 식별자임.
     * @param request 수정된 결제 정보임.
     * @return 성공 여부 응답임.
     */
    @Operation(summary = "결제안 수정", description = "기존 결제안과 참여자 정보를 전체 덮어쓰기 방식으로 수정함.")
    @PutMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> updateExpense(
            @PathVariable Long roomId,
            @PathVariable Long expenseId,
            @RequestBody @Valid ExpenseRegistrationRequest request
    ) {
        expenseService.updateExpense(roomId, expenseId, request);
        return ApiResponseDto.success("결제안이 성공적으로 수정되었습니다.");
    }
}
