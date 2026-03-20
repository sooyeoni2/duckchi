package com.duckchi.pay.domain.settlement.controller;

import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
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
