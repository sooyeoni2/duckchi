package com.duckchi.core.domain.account.controller;

import com.duckchi.core.domain.account.dto.request.SetPayPasswordRequest;
import com.duckchi.core.domain.account.dto.request.VerifyPayPasswordRequest;
import com.duckchi.core.domain.account.service.AccountService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/pay-password")
@Tag(name = "PayPassword", description = "결제 비밀번호 기능 API")
public class PayPasswordController {

    private final AccountService accountService;

    @Operation(summary = "결제 비밀번호 설정 API ", description = "결제 비밀번호를 설정합니다.")
    @PostMapping
    public ResponseEntity<ApiResponseDto<Void>> setPayPassword(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody SetPayPasswordRequest request
    ) {
        accountService.setPayPassword(userId, request);
        return ResponseEntity.ok(ApiResponseDto.successMsg("결제 비밀번호가 설정되었습니다."));
    }

    @Operation(summary = "결제 비밀번호 검증 API", description = "결제 비밀번호를 검증합니다.")
    @PostMapping("/vertify")
    public ResponseEntity<ApiResponseDto<Void>> verifyPayPassword(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody VerifyPayPasswordRequest request
    ) {
        accountService.verifyPayPassword(userId, request);
        return ResponseEntity.ok(ApiResponseDto.successMsg("결제 비밀번호가 검증되었습니다."));
    }
}
