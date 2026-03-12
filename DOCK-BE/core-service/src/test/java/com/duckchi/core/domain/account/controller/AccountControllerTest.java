package com.duckchi.core.domain.account.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.core.domain.account.dto.response.RegisterBankAccountResponse;
import com.duckchi.core.domain.account.service.AccountService;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.global.error.GlobalExceptionHandler;
import com.duckchi.core.infra.security.config.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AccountController.class)
@Import({GlobalExceptionHandler.class, SecurityConfig.class})
@AutoConfigureMockMvc(addFilters = false)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AccountService accountService;

    // AUTH-03 API 계약 테스트: 정상 응답, 요청값 검증 실패, 서비스 예외의 HTTP 매핑을 검증한다.
    // 정상 요청이 들어오면 200과 명세에 맞는 응답 body를 반환하는지 확인한다.
    @Test
    @DisplayName("returns 200 and response payload for valid request")
    void registerBankAccount_whenRequestValid_thenReturnOk() throws Exception {
        RegisterBankAccountResponse response = new RegisterBankAccountResponse(
                10L,
                "088",
                "SHINHAN",
                "1234************"
        );

        when(accountService.registerBankAccount(eq(1L), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/bank-accounts")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestBody("088", "1234567890123456"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accountId").value(10))
                .andExpect(jsonPath("$.data.bankCode").value("088"))
                .andExpect(jsonPath("$.data.bankName").value("SHINHAN"))
                .andExpect(jsonPath("$.data.maskedAccountNo").value("1234************"));

        verify(accountService).registerBankAccount(eq(1L), any());
    }

    // accountNo 형식이 validation 조건에 맞지 않으면 400과 공통 에러 응답을 반환하는지 확인한다.
    @Test
    @DisplayName("returns 400 when account number format is invalid")
    void registerBankAccount_whenAccountNoInvalid_thenReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/bank-accounts")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestBody("088", "12ab"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }

    // bankCode 형식이 validation 조건에 맞지 않으면 400과 공통 에러 응답을 반환하는지 확인한다.
    @Test
    @DisplayName("returns 400 when bank code format is invalid")
    void registerBankAccount_whenBankCodeInvalid_thenReturnBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/bank-accounts")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestBody("88", "1234567890123456"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }

    // 서비스에서 발생한 ACCOUNT_ALREADY_REGISTERED 예외가 HTTP 409로 매핑되는지 확인한다.
    @Test
    @DisplayName("maps service conflict exception to 409 response")
    void registerBankAccount_whenServiceThrowsConflict_thenReturnConflict() throws Exception {
        when(accountService.registerBankAccount(eq(1L), any()))
                .thenThrow(new CustomException(ErrorCode.ACCOUNT_ALREADY_REGISTERED));

        mockMvc.perform(post("/api/v1/auth/bank-accounts")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RequestBody("088", "1234567890123456"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCOUNT-409-1"));
    }

    private record RequestBody(String bankCode, String accountNo) {
    }
}