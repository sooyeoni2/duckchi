package com.duckchi.pay.domain.room.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Test
    void createRoom_success_returns201() throws Exception {
        CreateRoomResponse response = CreateRoomResponse.builder()
                .roomId(101L)
                .name("제주여행")
                .category("기타")
                .status("READY")
                .createdAt(LocalDateTime.of(2026, 3, 12, 10, 0))
                .build();

        when(roomService.createRoom(eq(7L), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/rooms")
                        .header("X-User-Id", "7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"제주여행",
                                  "description":"C102뒷풀이"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.roomId").value(101))
                .andExpect(jsonPath("$.data.name").value("제주여행"))
                .andExpect(jsonPath("$.data.category").value("기타"))
                .andExpect(jsonPath("$.data.status").value("READY"));
    }

    @Test
    void createRoom_unauthorized_returns401() throws Exception {
        when(roomService.createRoom(eq(null), any()))
                .thenThrow(new CustomException(ErrorCode.COMMON_UNAUTHORIZED));

        mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"제주여행"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"))
                .andExpect(jsonPath("$.msg").value("인증이 필요합니다."));
    }

    @Test
    void updateRoom_success_returns200() throws Exception {
        mockMvc.perform(patch("/api/v1/rooms/101")
                        .header("X-User-Id", "7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"수정된방이름",
                                  "category":"TRAVEL"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("수정이 완료되었습니다."));
    }
}
