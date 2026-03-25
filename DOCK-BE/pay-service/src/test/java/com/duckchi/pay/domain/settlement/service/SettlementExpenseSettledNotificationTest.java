package com.duckchi.pay.domain.settlement.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.settlement.dto.event.ExpenseSettledNotificationEvent;
import com.duckchi.pay.domain.settlement.dto.request.SettlementManualTransferRequest;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.infra.kafka.service.OutboxEventCommandService;
import com.duckchi.pay.infra.kafka.type.KafkaTopicNames;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SettlementExpenseSettledNotificationTest {

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
    private OutboxEventCommandService outboxEventCommandService;

    @InjectMocks
    private SettlementServiceImpl settlementService;

    @Test
    void manualTransferSettlement_whenLastPendingSettlementCompletes_savesExpenseSettledOutboxEvent() {
        // given: 마지막 미정산 건이 수동 정산 완료되면 expense 완료 알림 이벤트를 저장한다.
        Long currentUserId = 8L;
        Long settlementId = 101L;
        Long expenseId = 301L;

        SettlementManualTransferRequest request = new SettlementManualTransferRequest(settlementId);

        Settlement settlement = Settlement.builder()
                .expenseId(expenseId)
                .requesterUserId(currentUserId)
                .payerUserId(20L)
                .status("PENDING")
                .build();
        ReflectionTestUtils.setField(settlement, "id", settlementId);

        Expense expense = Expense.builder()
                .roomId(1L)
                .roomSessionId(2L)
                .payerUserId(55L)
                .payerUserName("payer")
                .inputType("MANUAL")
                .status("REQUESTED")
                .title("정산 완료 테스트")
                .totalAmount(10000)
                .build();
        ReflectionTestUtils.setField(expense, "id", expenseId);

        when(settlementRepository.findByIdForUpdate(settlementId)).thenReturn(Optional.of(settlement));
        when(expenseRepository.findByIdForUpdate(expenseId)).thenReturn(Optional.of(expense));
        when(settlementRepository.existsByExpenseIdAndStatus(expenseId, "PENDING")).thenReturn(false);

        // when: 수동 정산 완료를 처리한다.
        settlementService.manualTransferSettlement(currentUserId, request);

        // then: expense 완료 상태로 바뀌고 outbox 이벤트가 저장된다.
        assertEquals("COMPLETED", settlement.getStatus());
        assertEquals("SETTLED", expense.getStatus());

        ArgumentCaptor<ExpenseSettledNotificationEvent> eventCaptor =
                ArgumentCaptor.forClass(ExpenseSettledNotificationEvent.class);

        verify(outboxEventCommandService).save(
                eq("EXPENSE"),
                eq(expenseId),
                eq("EXPENSE_SETTLED"),
                eq(KafkaTopicNames.EXPENSE_SETTLED_NOTIFICATION_EVENT),
                eventCaptor.capture()
        );

        ExpenseSettledNotificationEvent event = eventCaptor.getValue();
        assertEquals(expenseId, event.getExpenseId());
        assertEquals("정산 완료 테스트", event.getExpenseTitle());
        assertEquals(55L, event.getPayerUserId());
    }

    @Test
    void manualTransferSettlement_whenPendingSettlementStillExists_doesNotSaveExpenseSettledOutboxEvent() {
        // given: 아직 남은 미정산 건이 있으면 expense 완료 알림 이벤트를 저장하지 않는다.
        Long currentUserId = 8L;
        Long settlementId = 101L;
        Long expenseId = 301L;

        SettlementManualTransferRequest request = new SettlementManualTransferRequest(settlementId);

        Settlement settlement = Settlement.builder()
                .expenseId(expenseId)
                .requesterUserId(currentUserId)
                .payerUserId(20L)
                .status("PENDING")
                .build();
        ReflectionTestUtils.setField(settlement, "id", settlementId);

        Expense expense = Expense.builder()
                .roomId(1L)
                .roomSessionId(2L)
                .payerUserId(55L)
                .payerUserName("payer")
                .inputType("MANUAL")
                .status("REQUESTED")
                .title("정산 진행중 테스트")
                .totalAmount(10000)
                .build();
        ReflectionTestUtils.setField(expense, "id", expenseId);

        when(settlementRepository.findByIdForUpdate(settlementId)).thenReturn(Optional.of(settlement));
        when(expenseRepository.findByIdForUpdate(expenseId)).thenReturn(Optional.of(expense));
        when(settlementRepository.existsByExpenseIdAndStatus(expenseId, "PENDING")).thenReturn(true);

        // when: 수동 정산 완료를 처리한다.
        settlementService.manualTransferSettlement(currentUserId, request);

        // then: expense는 아직 정산 완료로 바뀌지 않고 outbox도 저장되지 않는다.
        assertEquals("REQUESTED", expense.getStatus());
        verify(outboxEventCommandService, never()).save(
                eq("EXPENSE"),
                eq(expenseId),
                eq("EXPENSE_SETTLED"),
                eq(KafkaTopicNames.EXPENSE_SETTLED_NOTIFICATION_EVENT),
                any()
        );
    }
}
