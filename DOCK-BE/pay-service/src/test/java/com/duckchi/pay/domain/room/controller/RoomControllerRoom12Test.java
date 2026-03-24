package com.duckchi.pay.domain.room.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.RoomMySetItemResponse;
import com.duckchi.pay.domain.room.dto.response.RoomMySetResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class RoomControllerRoom12Test {

    @Mock
    private RoomService roomService;

    @InjectMocks
    private RoomController roomController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(roomController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getMySet_success_returns200() throws Exception {
        RoomMySetResponse response = new RoomMySetResponse(
                30000,
                List.of(new RoomMySetItemResponse(
                        981302L,
                        981207L,
                        "고기집",
                        "류병선",
                        6,
                        20000,
                        false,
                        LocalDateTime.of(2026, 3, 23, 14, 10, 0)
                )),
                180000
        );

        when(roomService.getMySet(101L, 7L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/rooms/101/my-set")
                        .header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.myTotal").value(30000))
                .andExpect(jsonPath("$.data.roomTotalAmount").value(180000))
                .andExpect(jsonPath("$.data.mySet[0].settlementId").value(981302))
                .andExpect(jsonPath("$.data.mySet[0].isCompleted").value(false))
                .andExpect(jsonPath("$.data.mySet[0].requestedAt").exists());
    }

    @Test
    void getMySet_withoutHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/101/my-set"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void getMySet_invalidHeader_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/101/my-set")
                        .header("X-User-Id", "not-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }
}
