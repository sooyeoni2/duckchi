package com.duckchi.pay.domain.settlement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
}
