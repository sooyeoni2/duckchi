package com.duckchi.pay.domain.settlement.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duckchi.pay.domain.settlement.service.SettlementService;
import com.duckchi.pay.global.error.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SettlementController.class)
@Import(GlobalExceptionHandler.class)
class SettlementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SettlementService settlementService;

    @MockBean
    private JpaMetamodelMappingContext jpaMetamodelMappingContext;

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
}
