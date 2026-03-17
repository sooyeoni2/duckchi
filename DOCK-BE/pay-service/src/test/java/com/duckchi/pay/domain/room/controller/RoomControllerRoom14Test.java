package com.duckchi.pay.domain.room.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import com.duckchi.pay.infra.security.jwt.JwtUserIdResolver;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerRoom14Test {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @MockBean
    private JwtUserIdResolver jwtUserIdResolver;

    @Test
    void toggleAutoDebitConsent_success_returns200() throws Exception {
        UpdateAutoDebitConsentResponse response = UpdateAutoDebitConsentResponse.builder()
                .roomId(101L)
                .userId(7L)
                .role("MEMBER")
                .isAgreed(true)
                .build();

        when(jwtUserIdResolver.resolveRequired("Bearer valid-token")).thenReturn(7L);
        when(roomService.toggleAutoDebitConsent(101L, 7L)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/rooms/101/my-transfer-agree")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(101))
                .andExpect(jsonPath("$.data.userId").value(7))
                .andExpect(jsonPath("$.data.role").value("MEMBER"))
                .andExpect(jsonPath("$.data.isAgreed").value(true));
    }

    @Test
    void toggleAutoDebitConsent_withoutHeader_returns401() throws Exception {
        when(jwtUserIdResolver.resolveRequired(null))
                .thenThrow(new CustomException(ErrorCode.COMMON_UNAUTHORIZED));

        mockMvc.perform(patch("/api/v1/rooms/101/my-transfer-agree"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void toggleAutoDebitConsent_nonParticipant_returns403WithRoom04Message() throws Exception {
        when(jwtUserIdResolver.resolveRequired("Bearer valid-token")).thenReturn(7L);
        when(roomService.toggleAutoDebitConsent(101L, 7L))
                .thenThrow(new CustomException(
                        "해당 모임의 멤버만 자동이체 동의 여부를 변경할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        mockMvc.perform(patch("/api/v1/rooms/101/my-transfer-agree")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-403-1"))
                .andExpect(jsonPath("$.msg").value("해당 모임의 멤버만 자동이체 동의 여부를 변경할 수 있습니다."));
    }
}
