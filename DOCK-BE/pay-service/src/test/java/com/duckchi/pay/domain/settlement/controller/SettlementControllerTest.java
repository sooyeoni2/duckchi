package com.duckchi.pay.domain.settlement.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementItemResponse;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementsResponse;
import com.duckchi.pay.domain.settlement.service.SettlementService;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SettlementControllerTest {

    @Mock
    private SettlementService settlementService;

    @InjectMocks
    private SettlementController settlementController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(settlementController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void requestSettlements_success_returns200() throws Exception {
        doNothing().when(settlementService).requestSettlements(eq(1L), any());

        mockMvc.perform(post("/api/v1/settlements/request")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestedExpenseIds": [101, 102]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.msg").value("성공적으로 정산 요청이 완료되었습니다."));
    }

    @Test
    void requestSettlements_withoutHeader_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/settlements/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestedExpenseIds": [101]
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }

    @Test
    void requestSettlements_withInvalidHeader_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/settlements/request")
                        .header("X-User-Id", "not-number")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "requestedExpenseIds": [101]
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-400-1"));
    }

    @Test
    void transferSettlements_success_returns200() throws Exception {
        doNothing().when(settlementService).transferSettlements(eq(1L), any());

        mockMvc.perform(post("/api/v1/settlements/transfer")
                        .header("X-User-Id", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "settlementIds": [301, 302]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.msg").value("성공적으로 정산이 완료되었습니다."));
    }

    @Test
    void getPendingSettlements_success_returns200() throws Exception {
        PendingSettlementsResponse response = new PendingSettlementsResponse(
                981201L,
                981001L,
                "C102회식",
                1L,
                "류병선",
                120000,
                1,
                5,
                List.of(new PendingSettlementItemResponse(
                        981301L,
                        2L,
                        "김수연",
                        20000,
                        "PENDING",
                        null,
                        null
                ))
        );

        when(settlementService.getPendingSettlements(1L, 981201L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/settlements/pending-settlements")
                        .header("X-User-Id", "1")
                        .queryParam("expenseId", "981201"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.expenseId").value(981201))
                .andExpect(jsonPath("$.data.pendingCount").value(1))
                .andExpect(jsonPath("$.data.completedCount").value(5))
                .andExpect(jsonPath("$.data.settlements[0].settlementId").value(981301));
    }

    @Test
    void getPendingSettlements_withoutHeader_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/settlements/pending-settlements")
                        .queryParam("expenseId", "981201"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("COMMON-401-1"));
    }
}