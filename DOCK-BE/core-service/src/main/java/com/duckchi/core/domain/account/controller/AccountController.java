package com.duckchi.core.domain.account.controller;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.service.AccountService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth/bank-accounts")
@Tag(name="Account",description="유저 계좌 관리 API")
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "은행 선택/계좌 등록 API" , description = "은행을 선택하고 계좌를 등록합니다.")
    @PostMapping
    public ResponseEntity<ApiResponseDto<RegisterBankAccountResponse>> registerBankAccount(
            @Valid @RequestBody RegisterBankAccountRequest request
    ) {
        // TODO: 유저 부분 구현되면 실제 유저 정보로 바꾸기
        Long userId = 1L;
        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }
}
