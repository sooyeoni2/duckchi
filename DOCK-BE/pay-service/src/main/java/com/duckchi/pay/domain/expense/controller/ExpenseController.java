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
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 결제안 및 계좌 거래 내역 관련 API를 제공하는 컨트롤러이다.
 */
@Tag(name = "Expense", description = "결제안 및 계좌 거래 내역 관리 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpenseController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final ExpenseService expenseService;

    @Operation(summary = "계좌 거래 내역 조회", description = "로그인 사용자의 인증된 계좌에 대한 최근 거래 내역을 조회한다. 요청 본문은 호환성을 위해 선택적으로 받는다.")
    @PostMapping("/expenses/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @RequestBody(required = false) @Valid AccountHistoryRequest request
    ) {
        return ApiResponseDto.success(expenseService.getAccountHistory(userId, request));
    }

    @Operation(summary = "결제안 등록", description = "특정 모임방에 새로운 결제안을 등록한다.")
    @PostMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<Long> registerExpense(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId,
            @RequestBody @Valid ExpenseRegistrationRequest request
    ) {
        return ApiResponseDto.success(expenseService.registerExpense(userId, request));
    }

    @Operation(summary = "모임방 결제안 목록 조회", description = "특정 모임방에 등록된 모든 결제안을 최신순으로 조회한다.")
    @GetMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<List<ExpenseResponse>> getExpenses(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId
    ) {
        return ApiResponseDto.success(expenseService.getExpensesByRoom(roomId));
    }

    @Operation(summary = "내가 생성한 결제안 목록 조회", description = "특정 모임방에서 로그인 사용자가 생성한 결제안만 최신순으로 조회한다.")
    @GetMapping("/rooms/{roomId}/expenses/me")
    public ApiResponseDto<List<ExpenseResponse>> getMyExpenses(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId
    ) {
        return ApiResponseDto.success(expenseService.getMyExpensesByRoom(userId, roomId));
    }

    @Operation(summary = "결제안 상세 조회", description = "특정 결제안의 참여자 및 품목별 상세 정보를 조회한다.")
    @GetMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<ExpenseDetailResponse> getExpenseDetail(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId,
            @PathVariable Long expenseId
    ) {
        return ApiResponseDto.success(expenseService.getExpenseDetail(roomId, expenseId));
    }

    @Operation(summary = "결제안 삭제", description = "로그인 사용자가 생성한 결제안을 삭제한다.")
    @DeleteMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> deleteExpense(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId,
            @PathVariable Long expenseId
    ) {
        expenseService.deleteExpense(userId, roomId, expenseId);
        return ApiResponseDto.success("결제안이 성공적으로 삭제되었습니다.");
    }

    @Operation(summary = "결제안 수정", description = "로그인 사용자가 생성한 결제안을 전체 덮어쓰기 방식으로 수정한다.")
    @PutMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> updateExpense(
            @RequestHeader(USER_ID_HEADER) Long userId,
            @PathVariable Long roomId,
            @PathVariable Long expenseId,
            @RequestBody @Valid ExpenseRegistrationRequest request
    ) {
        expenseService.updateExpense(userId, roomId, expenseId, request);
        return ApiResponseDto.success("결제안이 성공적으로 수정되었습니다.");
    }
}
