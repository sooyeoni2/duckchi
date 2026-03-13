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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth/bank-accounts")
@Tag(name = "Account", description = "사용자 계좌 관리 API")
public class AccountController {

    private final AccountService accountService;

    @Operation(summary = "은행 선택/계좌 등록 API", description = "은행을 선택하고 계좌를 등록합니다.")
    @PostMapping
    public ResponseEntity<ApiResponseDto<RegisterBankAccountResponse>> registerBankAccount(
            @Valid @RequestBody RegisterBankAccountRequest request
    ) {
        // TODO: 인증 구현 후 실제 로그인 사용자 정보로 교체
        Long userId = 1L;
        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @Operation(summary = "등록 계좌 삭제 API", description = "사용자가 등록한 계좌를 삭제합니다.")
    @PostMapping("/{accountId}/delete")
    public ResponseEntity<ApiResponseDto<Void>> deleteBankAccount(@PathVariable Long accountId) {
        // TODO: 인증 구현 후 실제 로그인 사용자 정보로 교체
        Long userId = 1L;
        accountService.deleteBankAccount(userId, accountId);
        return ResponseEntity.ok(ApiResponseDto.successMsg("계좌가 삭제되었습니다."));
    }
}
