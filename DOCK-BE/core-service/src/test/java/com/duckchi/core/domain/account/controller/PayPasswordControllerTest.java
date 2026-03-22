package com.duckchi.core.domain.account.controller;

import com.duckchi.core.domain.account.dto.request.SetPayPasswordRequest;
import com.duckchi.core.domain.account.dto.request.VerifyPayPasswordRequest;
import com.duckchi.core.domain.account.dto.response.PayPasswordFailResponse;
import com.duckchi.core.domain.account.service.AccountService;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PayPasswordController.class)
class PayPasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AccountService accountService;

    @Test
    void setPayPassword_whenRequestIsValid_returnsSuccessMessage() throws Exception {
        // given: 정상적인 결제 비밀번호 설정 요청이 준비되어 있다.
        SetPayPasswordRequest request = new SetPayPasswordRequest("123456");

        // when & then: 200 응답과 성공 메시지를 반환한다.
        mockMvc.perform(post("/api/v1/pay-password")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.msg").isNotEmpty());
    }

    @Test
    void setPayPassword_whenValidationFails_returnsBadRequest() throws Exception {
        // given: 숫자 6자리 형식을 만족하지 않는 요청이 있다.
        SetPayPasswordRequest request = new SetPayPasswordRequest("12");

        // when & then: validation 실패로 400 응답을 반환한다.
        mockMvc.perform(post("/api/v1/pay-password")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_INVALID_INPUT.getCode()));
    }

    @Test
    void verifyPayPassword_whenRequestIsValid_returnsSuccessMessage() throws Exception {
        // given: 정상적인 결제 비밀번호 검증 요청이 준비되어 있다.
        VerifyPayPasswordRequest request = new VerifyPayPasswordRequest("123456");

        // when & then: 200 응답과 성공 메시지를 반환한다.
        mockMvc.perform(post("/api/v1/pay-password/vertify")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.msg").isNotEmpty());
    }

    @Test
    void verifyPayPassword_whenValidationFails_returnsBadRequest() throws Exception {
        // given: 숫자 6자리 형식을 만족하지 않는 검증 요청이 있다.
        VerifyPayPasswordRequest request = new VerifyPayPasswordRequest("1");

        // when & then: validation 실패로 400 응답을 반환한다.
        mockMvc.perform(post("/api/v1/pay-password/vertify")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_INVALID_INPUT.getCode()));
    }

    @Test
    void verifyPayPassword_whenServiceThrowsMismatch_returnsMappedErrorResponse() throws Exception {
        // given: 서비스가 mismatch 예외와 failCount 데이터를 반환한다.
        VerifyPayPasswordRequest request = new VerifyPayPasswordRequest("123456");
        PayPasswordFailResponse data = new PayPasswordFailResponse(1);

        doThrow(new CustomException(ErrorCode.PAY_PASSWORD_MISMATCH, data))
                .when(accountService).verifyPayPassword(1L, request);

        // when & then: 400 응답과 failCount 데이터가 매핑된다.
        mockMvc.perform(post("/api/v1/pay-password/vertify")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.PAY_PASSWORD_MISMATCH.getCode()))
                .andExpect(jsonPath("$.data.failCount").value(1));
    }
}
