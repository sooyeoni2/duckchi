package com.duckchi.core.domain.account.controller;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
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

    @Operation(summary = "은행 선택/계좌 등록 API", description = "은행을 선택하고 계좌를 등록합니다. 1원 송금도 함께 진행합니다.")
    @PostMapping
    public ResponseEntity<ApiResponseDto<RegisterBankAccountResponse>> registerBankAccount(
            @Valid @RequestBody RegisterBankAccountRequest request
    ) {
        Long userId = 1L;
        RegisterBankAccountResponse response = accountService.registerBankAccount(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response, "계좌로 1원을 보냈습니다. 1원 인증을 진행해 주세요."));
    }

    @Operation(summary = "1원 인증 API", description = "등록한 계좌에 대해 1원 인증을 수행합니다.")
    @PostMapping("/{accountId}/verify-1won")
    public ResponseEntity<ApiResponseDto<VerifyOneWonResponse>> verifyOneWon(
            @PathVariable Long accountId,
            @Valid @RequestBody VerifyOneWonRequest request
    ) {
        Long userId = 1L;
        VerifyOneWonResponse response = accountService.verifyOneWon(userId, accountId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response, "1원 인증이 완료되었습니다."));
    }

    @Operation(summary = "등록 계좌 삭제 API", description = "사용자가 등록한 계좌를 삭제합니다.")
    @PostMapping("/{accountId}/delete")
    public ResponseEntity<ApiResponseDto<Void>> deleteBankAccount(@PathVariable Long accountId) {
        Long userId = 1L;
        accountService.deleteBankAccount(userId, accountId);
        return ResponseEntity.ok(ApiResponseDto.successMsg("계좌가 삭제되었습니다."));
    }
}
