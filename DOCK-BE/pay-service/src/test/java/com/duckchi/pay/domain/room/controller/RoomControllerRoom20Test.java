package com.duckchi.pay.domain.room.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.GetAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerRoom20Test {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RoomService roomService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

    @Test
    void getAutoDebitConsent_success_returns200() throws Exception {
        GetAutoDebitConsentResponse response = GetAutoDebitConsentResponse.builder()
                .roomId(101L)
                .userId(7L)
                .role("MEMBER")
                .isAgreed(true)
                .agreedCount(2)
                .participantCount(6)
                .consentRate(33)
                .build();

        when(roomService.getAutoDebitConsent(101L, 7L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/rooms/101/auto-debit/consents")
                        .header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(101))
                .andExpect(jsonPath("$.data.userId").value(7))
                .andExpect(jsonPath("$.data.role").value("MEMBER"))
                .andExpect(jsonPath("$.data.isAgreed").value(true))
                .andExpect(jsonPath("$.data.agreedCount").value(2))
                .andExpect(jsonPath("$.data.participantCount").value(6))
                .andExpect(jsonPath("$.data.consentRate").value(33));
    }

    @Test
    void getAutoDebitConsent_withoutHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/101/auto-debit/consents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void getAutoDebitConsent_nonParticipant_returns403WithRoom20Message() throws Exception {
        when(roomService.getAutoDebitConsent(101L, 7L))
                .thenThrow(new CustomException(
                        "해당 모임의 멤버만 자동이체 동의 상태를 조회할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        mockMvc.perform(get("/api/v1/rooms/101/auto-debit/consents")
                        .header("X-User-Id", "7"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-403-1"))
                .andExpect(jsonPath("$.msg").value("해당 모임의 멤버만 자동이체 동의 상태를 조회할 수 있습니다."));
    }
}

