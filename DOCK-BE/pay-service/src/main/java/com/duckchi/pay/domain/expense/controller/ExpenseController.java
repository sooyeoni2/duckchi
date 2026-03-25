package com.duckchi.pay.domain.expense.controller;

import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.service.ExpenseOcrService;
import com.duckchi.pay.domain.expense.service.ExpenseService;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 결제 도메인 외부 API 진입점.
 * 영수증 OCR, 계좌 거래 내역 조회, 결제안 CRUD 제공.
 */
@Tag(name = "Expense", description = "결제 및 계좌 거래 내역 관리 API")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExpenseController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final ExpenseService expenseService;
    private final ExpenseOcrService expenseOcrService;

    @Operation(summary = "OCR 실행", description = "S3에 업로드된 영수증 이미지 URL을 분석해 결제 등록용 초안 정보를 반환함")
    @PostMapping(value = "/expenses/ocr")
    public ApiResponseDto<ExpenseOcrDraftResponse> analyzeReceipt(
            @Parameter(description = "S3에 업로드된 영수증 이미지 URL", required = true)
            String imageUrl
    ) {
        return ApiResponseDto.success(expenseOcrService.analyzeReceipt(imageUrl));
    }

    @Operation(summary = "개발용 OCR 원본 응답 조회", description = "S3에 업로드된 영수증 이미지 URL을 OCR에 전달한 뒤 네이버 OCR 원본 JSON 응답을 그대로 반환함")
    @PostMapping(value = "/expenses/ocr/raw")
    public ApiResponseDto<JsonNode> analyzeReceiptRaw(
            @Parameter(description = "S3에 업로드된 영수증 이미지 URL", required = true)
            String imageUrl
    ) {
        return ApiResponseDto.success(expenseOcrService.analyzeReceiptRaw(imageUrl));
    }

    @Operation(summary = "계좌 거래 내역 조회", description = "로그인 사용자의 대표 계좌 기준으로 최근 거래 내역을 조회함")
    @PostMapping("/expenses/account-history")
    public ApiResponseDto<List<AccountHistoryResponse>> getAccountHistory(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @RequestBody(required = false) @Valid AccountHistoryRequest request
    ) {
        return ApiResponseDto.success(expenseService.getAccountHistory(userId, request));
    }

    @Operation(summary = "결제 참여자 조회", description = "결제안 등록 화면에서 사용할 방 참여자 상세 목록을 조회함")
    @GetMapping("/rooms/{roomId}/expenses/participants")
    public ApiResponseDto<List<ExpenseParticipantOptionResponse>> getExpenseParticipants(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId
    ) {
        return ApiResponseDto.success(expenseService.getExpenseParticipants(userId, roomId));
    }

    @Operation(summary = "결제안 등록", description = "특정 모임방에 새로운 결제안을 등록함")
    @PostMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<Long> registerExpense(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId,
            @RequestBody @Valid ExpenseUpsertRequest request
    ) {
        return ApiResponseDto.success(expenseService.registerExpense(userId, roomId, request));
    }

    @Operation(summary = "모임방 결제안 목록 조회", description = "특정 모임방에 등록된 모든 결제안을 최신순으로 조회함")
    @GetMapping("/rooms/{roomId}/expenses")
    public ApiResponseDto<List<ExpenseResponse>> getExpenses(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId
    ) {
        return ApiResponseDto.success(expenseService.getExpensesByRoom(userId, roomId));
    }

    @Operation(summary = "내가 생성한 결제안 목록 조회", description = "특정 모임방에서 로그인 사용자가 생성한 결제안만 최신순으로 조회함")
    @GetMapping("/rooms/{roomId}/expenses/me")
    public ApiResponseDto<List<ExpenseResponse>> getMyExpenses(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId
    ) {
        return ApiResponseDto.success(expenseService.getMyExpensesByRoom(userId, roomId));
    }

    @Operation(summary = "결제안 상세 조회", description = "특정 결제안의 참여자와 품목별 분담 정보를 조회함")
    @GetMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<ExpenseDetailResponse> getExpenseDetail(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId,
            @Parameter(description = "결제안 식별자", example = "10", required = true)
            @PathVariable Long expenseId
    ) {
        return ApiResponseDto.success(expenseService.getExpenseDetail(userId, roomId, expenseId));
    }

    @Operation(summary = "결제안 삭제", description = "로그인 사용자가 생성한 결제안을 삭제함")
    @DeleteMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> deleteExpense(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId,
            @Parameter(description = "결제안 식별자", example = "10", required = true)
            @PathVariable Long expenseId
    ) {
        expenseService.deleteExpense(userId, roomId, expenseId);
        return ApiResponseDto.success("결제안이 성공적으로 삭제되었습니다.");
    }

    @Operation(summary = "결제안 수정", description = "로그인 사용자가 생성한 결제안을 수정함")
    @PutMapping("/rooms/{roomId}/expenses/{expenseId}")
    public ApiResponseDto<String> updateExpense(
            @Parameter(description = "로그인 사용자 식별자", example = "1", required = true)
            @RequestHeader(USER_ID_HEADER) Long userId,
            @Parameter(description = "모임방 식별자", example = "1", required = true)
            @PathVariable Long roomId,
            @Parameter(description = "결제안 식별자", example = "10", required = true)
            @PathVariable Long expenseId,
            @RequestBody @Valid ExpenseUpsertRequest request
    ) {
        expenseService.updateExpense(userId, roomId, expenseId, request);
        return ApiResponseDto.success("결제안이 성공적으로 수정되었습니다.");
    }
}
