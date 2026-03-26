package com.duckchi.pay.domain.settlement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.duckchi.pay.infra.client.CoreClient;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.response.FinanceResponseHeader;
import com.duckchi.pay.infra.finance.dto.response.TransferResponse;
import com.duckchi.pay.infra.kafka.service.OutboxEventCommandService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SettlementTransferExecutorTest {

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CoreClient coreClient;

    @Mock
    private FinanceClient financeClient;

    @Mock
    private SettlementTransferIdempotencyService settlementTransferIdempotencyService;

    @Mock
    private BadgeTriggerService badgeTriggerService;

    @Mock
    private OutboxEventCommandService outboxEventCommandService;

    @InjectMocks
    private SettlementTransferExecutor settlementTransferExecutor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(settlementTransferExecutor, "financeApiKey", "test-key");
    }

    @Test
    void transferOne_whenFinanceResponseIsA1014_throwsInsufficientBalance() {
        Settlement settlement = createPendingSettlement(100L, 1L, 9L);
        stubCommonTransferDependencies(settlement);
        when(financeClient.transfer(any()))
                .thenReturn(new TransferResponse(
                        FinanceResponseHeader.builder()
                                .responseCode("A1014")
                                .responseMessage("잔액 부족")
                                .build(),
                        null
                ));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementTransferExecutor.transferOne(1L, 100L));

        assertEquals(ErrorCode.SETTLEMENT_INSUFFICIENT_BALANCE, ex.getErrorCode());
        assertEquals("PENDING", settlement.getStatus());
        assertNull(settlement.getBankTransactionId());
        verifyNoInteractions(expenseRepository, badgeTriggerService, outboxEventCommandService);
    }

    @Test
    void transferOne_whenFinanceResponseIsBusinessFailure_throwsFinanceApiError() {
        Settlement settlement = createPendingSettlement(100L, 1L, 9L);
        stubCommonTransferDependencies(settlement);
        when(financeClient.transfer(any()))
                .thenReturn(new TransferResponse(
                        FinanceResponseHeader.builder()
                                .responseCode("A9999")
                                .responseMessage("기타 오류")
                                .build(),
                        null
                ));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementTransferExecutor.transferOne(1L, 100L));

        assertEquals(ErrorCode.FINANCE_API_ERROR, ex.getErrorCode());
        assertEquals("PENDING", settlement.getStatus());
        assertNull(settlement.getBankTransactionId());
        verifyNoInteractions(expenseRepository, badgeTriggerService, outboxEventCommandService);
    }

    private void stubCommonTransferDependencies(Settlement settlement) {
        when(settlementTransferIdempotencyService.ensureFinanceRequestUniqueNo(100L)).thenReturn("REQ-100");
        when(settlementRepository.findByIdForUpdate(100L)).thenReturn(Optional.of(settlement));
        when(coreClient.getUserFinanceProfile(1L)).thenReturn(ApiResponseDto.success(
                UserFinanceProfileResponse.builder()
                        .ssafyUserKey("payer-key")
                        .accountNo("111-111")
                        .build()
        ));
        when(coreClient.getUserFinanceProfile(9L)).thenReturn(ApiResponseDto.success(
                UserFinanceProfileResponse.builder()
                        .ssafyUserKey("requester-key")
                        .accountNo("999-999")
                        .build()
        ));
    }

    private Settlement createPendingSettlement(Long id, Long payerUserId, Long requesterUserId) {
        Settlement settlement = Settlement.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .expenseId(200L)
                .roomName("C102 회식")
                .requesterUserId(requesterUserId)
                .requesterUserName("요청자")
                .payerUserId(payerUserId)
                .payerUserName("납부자")
                .payableAmount(15000)
                .status("PENDING")
                .build();
        ReflectionTestUtils.setField(settlement, "id", id);
        return settlement;
    }
}
