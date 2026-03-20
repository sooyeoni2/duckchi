package com.duckchi.core.domain.notification.controller;

import com.duckchi.core.domain.notification.dto.request.UpsertNotificationTokenRequest;
import com.duckchi.core.domain.notification.dto.response.NotificationTokenResponse;
import com.duckchi.core.domain.notification.service.NotificationTokenService;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationTokenController.class)
class NotificationTokenControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private NotificationTokenService notificationTokenService;

    @Test
    void upsertNotificationToken_whenRequestIsValid_returnsSuccessResponse() throws Exception {
        // given: 정상 요청과 서비스 성공 응답이 준비되어 있다.
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "token-1",
                true
        );
        NotificationTokenResponse response = new NotificationTokenResponse(
                10L,
                "device-1",
                true,
                true,
                LocalDateTime.of(2026, 3, 20, 12, 0)
        );

        when(notificationTokenService.upsert(1L, request)).thenReturn(response);

        // when & then: 200 응답과 notification token 등록 결과 data를 반환한다.
        mockMvc.perform(post("/api/v1/notifications/token")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10))
                .andExpect(jsonPath("$.data.deviceId").value("device-1"))
                .andExpect(jsonPath("$.data.notificationEnabled").value(true))
                .andExpect(jsonPath("$.data.is_active").value(true));
    }

    @Test
    void upsertNotificationToken_whenValidationFails_returnsBadRequest() throws Exception {
        // given: token 필드가 비어 있는 잘못된 요청을 보낸다.
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "",
                true
        );

        // when & then: validation 실패로 400 응답이 반환된다.
        mockMvc.perform(post("/api/v1/notifications/token")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.COMMON_INVALID_INPUT.getCode()));
    }

    @Test
    void upsertNotificationToken_whenServiceThrowsConflict_returnsMappedErrorResponse() throws Exception {
        // given: 서비스가 token 충돌 예외를 던진다.
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "token-1",
                true
        );

        when(notificationTokenService.upsert(eq(1L), any(UpsertNotificationTokenRequest.class)))
                .thenThrow(new CustomException(ErrorCode.NOTIFICATION_TOKEN_CONFLICT));

        // when & then: 409 에러 응답으로 매핑된다.
        mockMvc.perform(post("/api/v1/notifications/token")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.NOTIFICATION_TOKEN_CONFLICT.getCode()));
    }
    @Test
    void upsertNotificationToken_whenServiceThrowsUnauthorized_returnsMappedErrorResponse() throws Exception {
        // given: 서비스가 인증 예외를 던진다.
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "token-1",
                true
        );

        when(notificationTokenService.upsert(eq(1L), any(UpsertNotificationTokenRequest.class)))
                .thenThrow(new CustomException(ErrorCode.AUTH_UNAUTHORIZED));

        // when & then: 401 에러 응답으로 매핑된다.
        mockMvc.perform(post("/api/v1/notifications/token")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value(ErrorCode.AUTH_UNAUTHORIZED.getCode()));
    }
}
