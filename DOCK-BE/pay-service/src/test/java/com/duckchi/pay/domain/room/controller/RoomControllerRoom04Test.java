package com.duckchi.pay.domain.room.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerRoom04Test {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Test
    void updateAutoDebitConsent_success_returns200() throws Exception {
        UpdateAutoDebitConsentResponse response = UpdateAutoDebitConsentResponse.builder()
                .roomId(101L)
                .userId(7L)
                .role("MEMBER")
                .isAgreed(true)
                .build();

        when(roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.AGREED)).thenReturn(response);

        mockMvc.perform(patch("/api/v1/rooms/101/auto-debit/consents")
                        .queryParam("status", "AGREED")
                        .header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(101))
                .andExpect(jsonPath("$.data.userId").value(7))
                .andExpect(jsonPath("$.data.role").value("MEMBER"))
                .andExpect(jsonPath("$.data.isAgreed").value(true));
    }

    @Test
    void updateAutoDebitConsent_withoutHeader_returns401() throws Exception {
        when(roomService.updateAutoDebitConsent(101L, null, AutoDebitConsentStatus.AGREED))
                .thenThrow(new CustomException(ErrorCode.COMMON_UNAUTHORIZED));

        mockMvc.perform(patch("/api/v1/rooms/101/auto-debit/consents")
                        .queryParam("status", "AGREED"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void updateAutoDebitConsent_nonParticipant_returns403WithRoom04Message() throws Exception {
        when(roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.AGREED))
                .thenThrow(new CustomException(
                        "해당 모임의 멤버만 자동이체 동의/거절을 변경할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        mockMvc.perform(patch("/api/v1/rooms/101/auto-debit/consents")
                        .queryParam("status", "AGREED")
                        .header("X-User-Id", "7"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-403-1"))
                .andExpect(jsonPath("$.msg").value("해당 모임의 멤버만 자동이체 동의/거절을 변경할 수 있습니다."));
    }

    @Test
    void updateAutoDebitConsent_invalidStatus_returns400() throws Exception {
        mockMvc.perform(patch("/api/v1/rooms/101/auto-debit/consents")
                        .queryParam("status", "WRONG")
                        .header("X-User-Id", "7"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }
}