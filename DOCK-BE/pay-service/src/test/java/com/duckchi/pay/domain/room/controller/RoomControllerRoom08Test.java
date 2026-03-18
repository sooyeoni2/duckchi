package com.duckchi.pay.domain.room.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerRoom08Test {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoomService roomService;

    @Test
    void getRoomLists_success_returns200() throws Exception {
        RoomListResponse response = RoomListResponse.builder()
                .roomId(101L)
                .roomName("C102회식")
                .category("여행")
                .isProgress(true)
                .participants(List.of(1L, 2L, 3L))
                .participantCount(3)
                .totalPay(180000)
                .payCount(2)
                .percent(75)
                .build();

        when(roomService.getRoomLists(7L, true)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/rooms/room-lists")
                        .header("X-User-Id", "7")
                        .queryParam("isProgress", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].roomId").value(101))
                .andExpect(jsonPath("$.data[0].roomName").value("C102회식"))
                .andExpect(jsonPath("$.data[0].isProgress").value(true))
                .andExpect(jsonPath("$.data[0].participantCount").value(3))
                .andExpect(jsonPath("$.data[0].totalPay").value(180000))
                .andExpect(jsonPath("$.data[0].payCount").value(2))
                .andExpect(jsonPath("$.data[0].percent").value(75));
    }

    @Test
    void getRoomLists_withoutHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/room-lists"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void getRoomLists_invalidIsProgress_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/room-lists")
                        .header("X-User-Id", "7")
                        .queryParam("isProgress", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }
}