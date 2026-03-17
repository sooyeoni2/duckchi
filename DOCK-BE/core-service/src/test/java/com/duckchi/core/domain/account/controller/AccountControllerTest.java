package com.duckchi.core.domain.account.controller;

import com.duckchi.core.domain.account.dto.request.RegisterBankAccountRequest;
import com.duckchi.core.domain.account.dto.request.VerifyOneWonRequest;
import com.duckchi.core.domain.account.dto.response.AccountLockInfoResponse;
import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.dto.response.VerifyOneWonResponse;
import com.duckchi.core.domain.account.service.AccountService;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AccountController.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AccountService accountService;

    @Test
    void registerBankAccount_whenRequestIsValid_returnsSuccessResponse() throws Exception {
        // given: 정상 요청과 서비스 성공 응답이 준비되어 있다.
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        RegisterBankAccountResponse response = new RegisterBankAccountResponse(10L, "088", "신한은행", "1234********");

        when(accountService.registerBankAccount(1L, request)).thenReturn(response);

        // when & then: 200 응답과 data 구조를 반환한다.
        mockMvc.perform(post("/api/v1/bank-accounts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountId").value(10))
                .andExpect(jsonPath("$.data.bankCode").value("088"))
                .andExpect(jsonPath("$.data.bankName").value("신한은행"))
                .andExpect(jsonPath("$.data.maskedAccountNo").value("1234********"));
    }

    @Test
    void registerBankAccount_whenHeaderIsMissing_returnsBadRequestWithMissingHeaderCode() throws Exception {
        // given: 필수 내부 헤더 X-User-Id 없이 요청한다.
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");

        // when & then: MissingRequestHeaderException 이 400과 전용 에러코드로 매핑된다.
        mockMvc.perform(post("/api/v1/bank-accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_MISSING_REQUEST_HEADER.getCode()));
    }

    @Test
    void registerBankAccount_whenBodyValidationFails_returnsBadRequest() throws Exception {
        // given: 계좌번호 형식이 잘못된 요청을 보낸다.
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "12ab");

        // when & then: validation 실패로 400 응답이 반환된다.
        mockMvc.perform(post("/api/v1/bank-accounts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_INVALID_INPUT.getCode()));
    }

    @Test
    void registerBankAccount_whenServiceThrowsLockedException_returnsLockedResponseWithData() throws Exception {
        // given: 서비스가 잠금 예외와 lock info를 함께 던진다.
        RegisterBankAccountRequest request = new RegisterBankAccountRequest("088", "123456789012");
        AccountLockInfoResponse data = new AccountLockInfoResponse(LocalDateTime.of(2026, 3, 18, 12, 0));

        when(accountService.registerBankAccount(eq(1L), any(RegisterBankAccountRequest.class)))
                .thenThrow(new CustomException(ErrorCode.ACCOUNT_VERIFICATION_LOCKED, data));

        // when & then: 423과 error data가 함께 반환된다.
        mockMvc.perform(post("/api/v1/bank-accounts")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.ACCOUNT_VERIFICATION_LOCKED.getCode()))
                .andExpect(jsonPath("$.data.lockedUntil").value("2026-03-18T12:00:00"));
    }

    @Test
    void verifyOneWon_whenRequestIsValid_returnsSuccessResponse() throws Exception {
        // given: 정상 인증 요청과 서비스 성공 응답이 준비되어 있다.
        VerifyOneWonRequest request = new VerifyOneWonRequest("1234");
        VerifyOneWonResponse response = new VerifyOneWonResponse(10L, true);

        when(accountService.verifyOneWon(1L, 10L, request)).thenReturn(response);

        // when & then: 200 응답과 verified 결과를 반환한다.
        mockMvc.perform(post("/api/v1/bank-accounts/10/verify-1won")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountId").value(10))
                .andExpect(jsonPath("$.data.verified").value(true));
    }

    @Test
    void verifyOneWon_whenValidationFails_returnsBadRequest() throws Exception {
        // given: 인증코드 형식이 잘못된 요청을 보낸다.
        VerifyOneWonRequest request = new VerifyOneWonRequest("12");

        // when & then: validation 실패로 400 응답이 반환된다.
        mockMvc.perform(post("/api/v1/bank-accounts/10/verify-1won")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_INVALID_INPUT.getCode()));
    }

    @Test
    void deleteBankAccount_whenRequestIsValid_returnsSuccessMessage() throws Exception {
        // given: 삭제 요청이 정상 처리된다.

        // when & then: 200과 성공 메시지를 반환한다.
        mockMvc.perform(post("/api/v1/bank-accounts/10/delete")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.msg").isNotEmpty());
    }

    @Test
    void deleteBankAccount_whenServiceThrowsNotFound_returnsMappedErrorResponse() throws Exception {
        // given: 서비스가 ACCOUNT_INVALID 예외를 던진다.
        doThrow(new CustomException(ErrorCode.ACCOUNT_INVALID))
                .when(accountService).deleteBankAccount(1L, 10L);

        // when & then: 404 에러 응답으로 매핑된다.
        mockMvc.perform(post("/api/v1/bank-accounts/10/delete")
                        .header("X-User-Id", "1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.ACCOUNT_INVALID.getCode()));
    }
}
