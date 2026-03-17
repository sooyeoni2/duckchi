package com.duckchi.pay.domain.room.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;
import com.duckchi.pay.domain.room.service.InviteLinkService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import com.duckchi.pay.infra.security.jwt.JwtUserIdResolver;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(InviteLinkController.class)
@Import(GlobalExceptionHandler.class)
class InviteLinkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InviteLinkService inviteLinkService;

    @MockBean
    private JwtUserIdResolver jwtUserIdResolver;

    @Test
    void createInviteLink_success_returns200() throws Exception {
        CreateInviteLinkResponse response = CreateInviteLinkResponse.builder()
                .roomId(101L)
                .inviteLink("https://app.example.com/invite/AbCdEf")
                .inviteToken("AbCdEf")
                .status("ACTIVE")
                .expiresAt(LocalDateTime.of(2026, 3, 16, 10, 0))
                .regenerated(false)
                .build();

        when(jwtUserIdResolver.resolveRequired("Bearer valid-token")).thenReturn(7L);
        when(inviteLinkService.createInviteLink(eq(101L), eq(7L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/rooms/invites/101/link")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(101))
                .andExpect(jsonPath("$.data.inviteToken").value("AbCdEf"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.regenerated").value(false));
    }

    @Test
    void createInviteLink_withoutHeader_returns401() throws Exception {
        when(jwtUserIdResolver.resolveRequired(null))
                .thenThrow(new CustomException(ErrorCode.COMMON_UNAUTHORIZED));

        mockMvc.perform(post("/api/v1/rooms/invites/101/link"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void createInviteLink_nonParticipant_returns403() throws Exception {
        when(jwtUserIdResolver.resolveRequired("Bearer valid-token")).thenReturn(7L);
        when(inviteLinkService.createInviteLink(eq(101L), eq(7L)))
                .thenThrow(new CustomException(ErrorCode.ROOM_MEMBER_ONLY));

        mockMvc.perform(post("/api/v1/rooms/invites/101/link")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-403-1"));
    }

    @Test
    void validateInviteLink_success_returns200() throws Exception {
        when(jwtUserIdResolver.resolveOrNull(null)).thenReturn(null);
        when(inviteLinkService.validateInviteLink(eq("valid-token"), eq(null)))
                .thenReturn(ValidateInviteLinkResponse.of(true));

        mockMvc.perform(get("/api/v1/rooms/invites/valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.valid").value(true));
    }

    @Test
    void validateInviteLink_invalidToken_returns400() throws Exception {
        when(jwtUserIdResolver.resolveOrNull(null)).thenReturn(null);
        when(inviteLinkService.validateInviteLink(eq("invalid-token"), eq(null)))
                .thenThrow(new CustomException(ErrorCode.ROOM_INVALID_INVITE_LINK));

        mockMvc.perform(get("/api/v1/rooms/invites/invalid-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-400-3"));
    }

    @Test
    void validateInviteLink_alreadyParticipant_returns409() throws Exception {
        when(jwtUserIdResolver.resolveOrNull("Bearer valid-token")).thenReturn(7L);
        when(inviteLinkService.validateInviteLink(eq("valid-token"), eq(7L)))
                .thenThrow(new CustomException(ErrorCode.ROOM_ALREADY_PARTICIPANT));

        mockMvc.perform(get("/api/v1/rooms/invites/valid-token")
                        .header("Authorization", "Bearer valid-token"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ROOM-409-1"));
    }

    @Test
    void validateInviteLink_invalidAuthorization_returns401() throws Exception {
        when(jwtUserIdResolver.resolveOrNull("Token invalid"))
                .thenThrow(new CustomException(ErrorCode.COMMON_UNAUTHORIZED));

        mockMvc.perform(get("/api/v1/rooms/invites/valid-token")
                        .header("Authorization", "Token invalid"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }
}