package com.duckchi.pay.domain.room.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.room.dto.response.RoomSettlementDetailResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementItemSplitResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementParticipantStatusResponse;
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
class RoomControllerRoom13Test {

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
    void getSettlementDetail_success_returns200() throws Exception {
        RoomSettlementDetailResponse response = new RoomSettlementDetailResponse(
                981201L,
                101L,
                201L,
                "C102회식",
                "고기집",
                120000,
                "OCR",
                true,
                "REQUESTED",
                1L,
                "류병선",
                2,
                1,
                1,
                20000,
                false,
                LocalDateTime.of(2026, 3, 23, 18, 10, 0),
                List.of(new RoomSettlementParticipantStatusResponse(
                        981301L,
                        2L,
                        "김수연",
                        "#B7K",
                        null,
                        20000,
                        "PENDING",
                        true,
                        List.of(new RoomSettlementItemSplitResponse(7001L, "삼겹살", 2, 20000))
                ))
        );

        when(roomService.getSettlementDetail(101L, 981201L, 7L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/rooms/101/expenses/981201/settlement-detail")
                        .header("X-User-Id", "7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.expenseId").value(981201))
                .andExpect(jsonPath("$.data.inputType").value("OCR"))
                .andExpect(jsonPath("$.data.isItemized").value(true))
                .andExpect(jsonPath("$.data.participants[0].itemSplits[0].itemName").value("삼겹살"));
    }

    @Test
    void getSettlementDetail_withoutHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/101/expenses/981201/settlement-detail"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void getSettlementDetail_invalidHeader_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/rooms/101/expenses/981201/settlement-detail")
                        .header("X-User-Id", "not-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }
}
