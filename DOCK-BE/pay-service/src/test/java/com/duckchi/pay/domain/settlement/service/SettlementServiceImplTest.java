package com.duckchi.pay.domain.settlement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.settlement.dto.request.SettlementManualTransferRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementTransferRequest;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementItemResponse;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementsResponse;
import com.duckchi.pay.domain.settlement.dto.response.SettlementManualTransferResponse;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SettlementServiceImplTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseParticipantRepository expenseParticipantRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private SettlementTransferExecutor settlementTransferExecutor;

    @Mock
    private BadgeTriggerService badgeTriggerService;

    @InjectMocks
    private SettlementServiceImpl settlementService;

    @Test
    void requestSettlements_success_createsSettlementRowsAndMarksRequested() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("요청자")
                .inputType("MANUAL")
                .status("PENDING")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        ExpenseParticipant requester = ExpenseParticipant.builder()
                .expense(expense)
                .userId(1L)
                .userName("요청자")
                .userTag("#A")
                .splitAmount(15000)
                .build();

        ExpenseParticipant payer = ExpenseParticipant.builder()
                .expense(expense)
                .userId(2L)
                .userName("납부자")
                .userTag("#B")
                .splitAmount(15000)
                .build();

        Room room = Room.builder()
                .name("C102 회식")
                .category("회식")
                .description("desc")
                .isProgress(true)
                .build();
        ReflectionTestUtils.setField(room, "id", 10L);

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(10L, 1L)).thenReturn(true);
        when(settlementRepository.existsByExpenseIdIn(List.of(200L))).thenReturn(false);
        when(expenseParticipantRepository.findByExpense_IdInForUpdate(List.of(200L))).thenReturn(List.of(requester, payer));
        when(roomRepository.findAllById(any())).thenReturn(List.of(room));

        settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L)));

        ArgumentCaptor<List<Settlement>> captor = ArgumentCaptor.forClass(List.class);
        verify(settlementRepository).saveAll(captor.capture());
        verify(settlementRepository).flush();

        List<Settlement> saved = captor.getValue();
        assertEquals(1, saved.size());
        assertEquals(2L, saved.get(0).getPayerUserId());
        assertEquals("PENDING", saved.get(0).getStatus());
        assertEquals("REQUESTED", expense.getStatus());
    }

    @Test
    void requestSettlements_duplicateExpenseIds_throwsBadRequest() {
        SettlementRequestCreateRequest request = new SettlementRequestCreateRequest(List.of(1L, 1L));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, request));

        assertEquals(ErrorCode.COMMON_INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    void requestSettlements_whenAlreadyRequested_throwsConflict() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("요청자")
                .inputType("MANUAL")
                .status("REQUESTED")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(10L, 1L)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L))));

        assertEquals(ErrorCode.SETTLEMENT_ALREADY_REQUESTED, ex.getErrorCode());
    }

    @Test
    void requestSettlements_whenRequesterMismatch_throwsForbidden() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(99L)
                .payerUserName("다른요청자")
                .inputType("MANUAL")
                .status("PENDING")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L))));

        assertEquals(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER, ex.getErrorCode());
    }

    @Test
    void requestSettlements_whenSplitSumMismatch_throwsConflict() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("요청자")
                .inputType("MANUAL")
                .status("PENDING")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        ExpenseParticipant requester = ExpenseParticipant.builder()
                .expense(expense)
                .userId(1L)
                .userName("요청자")
                .userTag("#A")
                .splitAmount(10000)
                .build();

        ExpenseParticipant payer = ExpenseParticipant.builder()
                .expense(expense)
                .userId(2L)
                .userName("납부자")
                .userTag("#B")
                .splitAmount(15000)
                .build();

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(10L, 1L)).thenReturn(true);
        when(expenseParticipantRepository.findByExpense_IdInForUpdate(List.of(200L))).thenReturn(List.of(requester, payer));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L))));

        assertEquals(ErrorCode.SETTLEMENT_AMOUNT_MISMATCH, ex.getErrorCode());
    }

    @Test
    void requestSettlements_whenInvalidSplitAmount_throwsConflict() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("요청자")
                .inputType("MANUAL")
                .status("PENDING")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        ExpenseParticipant requester = ExpenseParticipant.builder()
                .expense(expense)
                .userId(1L)
                .userName("요청자")
                .userTag("#A")
                .splitAmount(30000)
                .build();

        ExpenseParticipant payer = ExpenseParticipant.builder()
                .expense(expense)
                .userId(2L)
                .userName("납부자")
                .userTag("#B")
                .splitAmount(0)
                .build();

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(10L, 1L)).thenReturn(true);
        when(expenseParticipantRepository.findByExpense_IdInForUpdate(List.of(200L))).thenReturn(List.of(requester, payer));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L))));

        assertEquals(ErrorCode.SETTLEMENT_PARTICIPANTS_INVALID, ex.getErrorCode());
    }

    @Test
    void requestSettlements_whenParticipantsEmpty_throwsConflict() {
        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("요청자")
                .inputType("MANUAL")
                .status("PENDING")
                .title("고기집")
                .totalAmount(30000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        when(expenseRepository.findAllByIdInForUpdate(List.of(200L))).thenReturn(List.of(expense));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(10L, 1L)).thenReturn(true);
        when(expenseParticipantRepository.findByExpense_IdInForUpdate(List.of(200L))).thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.requestSettlements(1L, new SettlementRequestCreateRequest(List.of(200L))));

        assertEquals(ErrorCode.SETTLEMENT_PARTICIPANTS_INVALID, ex.getErrorCode());
    }

    @Test
    void transferSettlements_success_callsExecutorInSortedOrder() {
        Settlement settlement30 = createSettlement(30L, 1L, "PENDING");
        Settlement settlement10 = createSettlement(10L, 1L, "PENDING");
        Settlement settlement20 = createSettlement(20L, 1L, "PENDING");

        when(settlementRepository.findAllByIdIn(List.of(30L, 10L, 20L)))
                .thenReturn(List.of(settlement30, settlement10, settlement20));

        settlementService.transferSettlements(1L, new SettlementTransferRequest(List.of(30L, 10L, 20L)));

        InOrder inOrder = inOrder(settlementTransferExecutor);
        inOrder.verify(settlementTransferExecutor).transferOne(1L, 10L);
        inOrder.verify(settlementTransferExecutor).transferOne(1L, 20L);
        inOrder.verify(settlementTransferExecutor).transferOne(1L, 30L);
    }

    @Test
    void transferSettlements_whenOneTransferFails_throwsPartialError() {
        Settlement settlement10 = createSettlement(10L, 1L, "PENDING");
        Settlement settlement20 = createSettlement(20L, 1L, "PENDING");

        when(settlementRepository.findAllByIdIn(List.of(10L, 20L))).thenReturn(List.of(settlement10, settlement20));
        org.mockito.Mockito.doAnswer(invocation -> {
                    Long settlementId = invocation.getArgument(1, Long.class);
                    if (Long.valueOf(20L).equals(settlementId)) {
                        throw new CustomException(ErrorCode.FINANCE_API_ERROR);
                    }
                    return null;
                })
                .when(settlementTransferExecutor)
                .transferOne(eq(1L), org.mockito.ArgumentMatchers.anyLong());

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.transferSettlements(1L, new SettlementTransferRequest(List.of(10L, 20L))));

        assertEquals(ErrorCode.SETTLEMENT_TRANSFER_PARTIAL, ex.getErrorCode());
        assertEquals(List.of(20L), ex.getData());
    }

    @Test
    void transferSettlements_whenPayerMismatch_throwsForbidden() {
        Settlement forbiddenSettlement = createSettlement(10L, 2L, "PENDING");

        when(settlementRepository.findAllByIdIn(List.of(10L))).thenReturn(List.of(forbiddenSettlement));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.transferSettlements(1L, new SettlementTransferRequest(List.of(10L))));

        assertEquals(ErrorCode.SETTLEMENT_FORBIDDEN_PAYER, ex.getErrorCode());
        verify(settlementTransferExecutor, never()).transferOne(any(), any());
    }

    @Test
    void transferSettlements_whenAlreadyCompleted_throwsConflict() {
        Settlement completedSettlement = createSettlement(10L, 1L, "COMPLETED");

        when(settlementRepository.findAllByIdIn(List.of(10L))).thenReturn(List.of(completedSettlement));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.transferSettlements(1L, new SettlementTransferRequest(List.of(10L))));

        assertEquals(ErrorCode.SETTLEMENT_ALREADY_COMPLETED, ex.getErrorCode());
        verify(settlementTransferExecutor, never()).transferOne(any(), any());
    }


    @Test
    void manualTransferSettlement_success_whenLastPending_marksExpenseSettled() {
        Settlement settlement = Settlement.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .expenseId(200L)
                .roomName("C102 회식")
                .requesterUserId(1L)
                .requesterUserName("총무")
                .payerUserId(2L)
                .payerUserName("납부자")
                .payableAmount(20000)
                .status("PENDING")
                .build();
        ReflectionTestUtils.setField(settlement, "id", 981301L);

        Expense expense = Expense.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .payerUserId(1L)
                .payerUserName("총무")
                .inputType("MANUAL")
                .status("REQUESTED")
                .title("고기집")
                .totalAmount(20000)
                .build();
        ReflectionTestUtils.setField(expense, "id", 200L);

        when(settlementRepository.findByIdForUpdate(981301L)).thenReturn(Optional.of(settlement));
        when(expenseRepository.findByIdForUpdate(200L)).thenReturn(Optional.of(expense));
        when(settlementRepository.existsByExpenseIdAndStatus(200L, "PENDING")).thenReturn(false);

        SettlementManualTransferResponse response = settlementService.manualTransferSettlement(
                1L,
                new SettlementManualTransferRequest(981301L)
        );

        assertEquals("COMPLETED", response.settlementStatus());
        assertEquals("SETTLED", response.expenseStatus());
        assertEquals("MANUAL-981301", settlement.getBankTransactionId());
        assertEquals("COMPLETED", settlement.getStatus());
    }

    @Test
    void manualTransferSettlement_whenRequesterMismatch_throwsForbidden() {
        Settlement settlement = Settlement.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .expenseId(200L)
                .roomName("C102 회식")
                .requesterUserId(99L)
                .requesterUserName("다른총무")
                .payerUserId(2L)
                .payerUserName("납부자")
                .payableAmount(20000)
                .status("PENDING")
                .build();
        ReflectionTestUtils.setField(settlement, "id", 981301L);

        when(settlementRepository.findByIdForUpdate(981301L)).thenReturn(Optional.of(settlement));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.manualTransferSettlement(1L, new SettlementManualTransferRequest(981301L)));

        assertEquals(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER, ex.getErrorCode());
        verify(expenseRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void manualTransferSettlement_whenAlreadyCompleted_throwsConflict() {
        Settlement settlement = Settlement.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .expenseId(200L)
                .roomName("C102 회식")
                .requesterUserId(1L)
                .requesterUserName("총무")
                .payerUserId(2L)
                .payerUserName("납부자")
                .payableAmount(20000)
                .status("COMPLETED")
                .build();
        ReflectionTestUtils.setField(settlement, "id", 981301L);

        when(settlementRepository.findByIdForUpdate(981301L)).thenReturn(Optional.of(settlement));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.manualTransferSettlement(1L, new SettlementManualTransferRequest(981301L)));

        assertEquals(ErrorCode.SETTLEMENT_ALREADY_COMPLETED, ex.getErrorCode());
        verify(expenseRepository, never()).findByIdForUpdate(any());
    }
    @Test
    void getPendingSettlements_success_returnsAggregatedResponse() {
        Settlement pendingSettlement = createSettlement(10L, 3L, "PENDING");
        Settlement completedSettlement = createSettlement(11L, 4L, "COMPLETED");

        when(settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(200L))
                .thenReturn(List.of(pendingSettlement, completedSettlement));

        PendingSettlementsResponse response = settlementService.getPendingSettlements(2L, 200L);

        assertEquals(200L, response.expenseId());
        assertEquals(40000, response.totalPayableAmount());
        assertEquals(1, response.pendingCount());
        assertEquals(1, response.completedCount());
        assertEquals(2, response.settlements().size());

        PendingSettlementItemResponse firstItem = response.settlements().get(0);
        assertEquals(10L, firstItem.settlementId());
        assertEquals("PENDING", firstItem.status());
    }

    @Test
    void getPendingSettlements_whenExpenseInvalid_throwsBadRequest() {
        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.getPendingSettlements(2L, 0L));

        assertEquals(ErrorCode.COMMON_INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    void getPendingSettlements_whenNotFound_throwsNotFound() {
        when(settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(200L)).thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.getPendingSettlements(2L, 200L));

        assertEquals(ErrorCode.SETTLEMENT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getPendingSettlements_whenRequesterMismatch_throwsForbidden() {
        Settlement settlement = createSettlement(10L, 3L, "PENDING");
        when(settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(200L)).thenReturn(List.of(settlement));

        CustomException ex = assertThrows(CustomException.class,
                () -> settlementService.getPendingSettlements(1L, 200L));

        assertEquals(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER, ex.getErrorCode());
    }
    private Settlement createSettlement(Long id, Long payerUserId, String status) {
        Settlement settlement = Settlement.builder()
                .roomId(10L)
                .roomSessionId(100L)
                .expenseId(200L)
                .roomName("C102 회식")
                .requesterUserId(2L)
                .requesterUserName("요청자")
                .payerUserId(payerUserId)
                .payerUserName("총무")
                .payableAmount(20000)
                .status(status)
                .build();
        ReflectionTestUtils.setField(settlement, "id", id);
        return settlement;
    }
}
