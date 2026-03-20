package com.duckchi.pay.domain.settlement.controller;

import com.duckchi.pay.domain.settlement.dto.request.SettlementManualTransferRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementTransferRequest;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementsResponse;
import com.duckchi.pay.domain.settlement.dto.response.SettlementManualTransferResponse;
import com.duckchi.pay.domain.settlement.service.SettlementService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/settlements")
@Tag(name = "Settlement", description = "SET API")
public class SettlementController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final SettlementService settlementService;

    @PostMapping("/request")
    @Operation(summary = "SET-01: 정산 요청 발송 API")
    public ResponseEntity<ApiResponseDto<Void>> requestSettlements(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody SettlementRequestCreateRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        settlementService.requestSettlements(currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.successMsg("성공적으로 정산 요청이 완료되었습니다."));
    }

    @PostMapping("/transfer")
    @Operation(summary = "SET-02: 정산 송금 API")
    public ResponseEntity<ApiResponseDto<Void>> transferSettlements(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody SettlementTransferRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        settlementService.transferSettlements(currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.successMsg("성공적으로 정산이 완료되었습니다."));
    }

    @PostMapping("/transfer/manual")
    @Operation(summary = "SET-03: 정산 수기 완료 처리 API")
    public ResponseEntity<ApiResponseDto<SettlementManualTransferResponse>> manualTransferSettlement(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody SettlementManualTransferRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        SettlementManualTransferResponse response = settlementService.manualTransferSettlement(currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response, "총무 확인으로 정산이 완료 처리되었습니다."));
    }

    @GetMapping("/pending-settlements")
    @Operation(summary = "SET-04: 총무 확인용 대기 정산 목록 조회 API")
    public ResponseEntity<ApiResponseDto<PendingSettlementsResponse>> getPendingSettlements(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @RequestParam("expenseId") Long expenseId
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        PendingSettlementsResponse response = settlementService.getPendingSettlements(currentUserId, expenseId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    private Long resolveRequiredUserId(String userIdHeader) {
        if (!StringUtils.hasText(userIdHeader)) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        try {
            return Long.parseLong(userIdHeader);
        } catch (NumberFormatException ex) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }
}