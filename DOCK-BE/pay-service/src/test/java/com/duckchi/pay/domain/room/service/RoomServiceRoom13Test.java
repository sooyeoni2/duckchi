package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseItem;
import com.duckchi.pay.domain.expense.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseItemParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementDetailResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementParticipantStatusResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.client.CoreClient;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RoomServiceRoom13Test {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseParticipantRepository expenseParticipantRepository;

    @Mock
    private ExpenseItemParticipantRepository expenseItemParticipantRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private RoomSessionRepository roomSessionRepository;

    @Mock
    private CoreClient coreClient;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void getSettlementDetail_manual_success_requesterIsCompleted() {
        Room room = createRoom(101L, "C102회식");
        Expense expense = createExpense(981201L, 101L, 201L, 1L, "류병선", "MANUAL", "REQUESTED", "고기집", 120000);

        ExpenseParticipant requester = createExpenseParticipant(expense, 1L, "류병선", "#A1", 20000);
        ExpenseParticipant payer = createExpenseParticipant(expense, 2L, "김수연", "#B7", 20000);

        Settlement settlement = createSettlement(981301L, 981201L, 2L, "PENDING", LocalDateTime.of(2026, 3, 23, 18, 0, 0));

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 2L)).thenReturn(true);
        when(expenseRepository.findByIdAndRoomId(981201L, 101L)).thenReturn(Optional.of(expense));
        when(expenseParticipantRepository.findByExpense_IdOrderByIdAsc(981201L)).thenReturn(List.of(requester, payer));
        when(settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(981201L)).thenReturn(List.of(settlement));

        RoomSettlementDetailResponse result = roomService.getSettlementDetail(101L, 981201L, 2L);

        assertEquals(981201L, result.expenseId());
        assertFalse(result.isItemized());
        assertEquals(2, result.participantCount());
        assertEquals(1, result.pendingCount());
        assertEquals(1, result.completedCount());
        assertEquals(20000, result.myPayableAmount());
        assertEquals(LocalDateTime.of(2026, 3, 23, 18, 0, 0), result.requestedAt());

        RoomSettlementParticipantStatusResponse requesterRow = result.participants().stream()
                .filter(p -> p.userId().equals(1L))
                .findFirst()
                .orElseThrow();

        assertEquals("COMPLETED", requesterRow.status());
        assertNull(requesterRow.settlementId());
        assertTrue(requesterRow.itemSplits().isEmpty());
    }

    @Test
    void getSettlementDetail_ocr_success_containsItemSplits() {
        Room room = createRoom(101L, "C102회식");
        Expense expense = createExpense(981202L, 101L, 201L, 1L, "류병선", "OCR", "REQUESTED", "한우마당", 150000);

        ExpenseParticipant requester = createExpenseParticipant(expense, 1L, "류병선", "#A1", 30000);
        ExpenseParticipant payer = createExpenseParticipant(expense, 2L, "김수연", "#B7", 40000);

        Settlement settlement = createSettlement(981302L, 981202L, 2L, "COMPLETED", LocalDateTime.of(2026, 3, 23, 18, 10, 0));

        ExpenseItem meat = createExpenseItem(7001L, expense, "삼겹살");
        ExpenseItem soju = createExpenseItem(7002L, expense, "소주");

        ExpenseItemParticipant split1 = createItemParticipant(meat, 2L, 2, 25000);
        ExpenseItemParticipant split2 = createItemParticipant(soju, 2L, 1, 15000);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 2L)).thenReturn(true);
        when(expenseRepository.findByIdAndRoomId(981202L, 101L)).thenReturn(Optional.of(expense));
        when(expenseParticipantRepository.findByExpense_IdOrderByIdAsc(981202L)).thenReturn(List.of(requester, payer));
        when(settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(981202L)).thenReturn(List.of(settlement));
        when(expenseItemParticipantRepository.findByExpenseIdWithExpenseItem(981202L)).thenReturn(List.of(split1, split2));

        RoomSettlementDetailResponse result = roomService.getSettlementDetail(101L, 981202L, 2L);

        assertTrue(result.isItemized());

        RoomSettlementParticipantStatusResponse payerRow = result.participants().stream()
                .filter(p -> p.userId().equals(2L))
                .findFirst()
                .orElseThrow();

        assertEquals(2, payerRow.itemSplits().size());
        assertEquals("삼겹살", payerRow.itemSplits().get(0).itemName());
        assertEquals(25000, payerRow.itemSplits().get(0).splitAmount());
    }

    @Test
    void getSettlementDetail_expensePending_throwsConflict() {
        Room room = createRoom(101L, "C102회식");
        Expense expense = createExpense(981203L, 101L, 201L, 1L, "류병선", "MANUAL", "PENDING", "카페", 30000);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 2L)).thenReturn(true);
        when(expenseRepository.findByIdAndRoomId(981203L, 101L)).thenReturn(Optional.of(expense));

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.getSettlementDetail(101L, 981203L, 2L));

        assertEquals(ErrorCode.SETTLEMENT_NOT_REQUESTED, ex.getErrorCode());
    }

    private Room createRoom(Long roomId, String roomName) {
        Room room = Room.builder()
                .name(roomName)
                .category("기타")
                .description("설명")
                .isProgress(true)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }

    private Expense createExpense(
            Long expenseId,
            Long roomId,
            Long roomSessionId,
            Long requesterUserId,
            String requesterUserName,
            String inputType,
            String status,
            String title,
            int totalAmount
    ) {
        Expense expense = Expense.builder()
                .roomId(roomId)
                .roomSessionId(roomSessionId)
                .payerUserId(requesterUserId)
                .payerUserName(requesterUserName)
                .inputType(inputType)
                .status(status)
                .title(title)
                .totalAmount(totalAmount)
                .createdAt(LocalDateTime.of(2026, 3, 23, 17, 50, 0))
                .build();
        ReflectionTestUtils.setField(expense, "id", expenseId);
        return expense;
    }

    private ExpenseParticipant createExpenseParticipant(Expense expense, Long userId, String userName, String userTag, int splitAmount) {
        return ExpenseParticipant.builder()
                .expense(expense)
                .userId(userId)
                .userName(userName)
                .userTag(userTag)
                .profileImageUrl(null)
                .splitAmount(splitAmount)
                .build();
    }

    private Settlement createSettlement(Long settlementId, Long expenseId, Long payerUserId, String status, LocalDateTime createdAt) {
        return Settlement.builder()
                .id(settlementId)
                .roomId(101L)
                .roomSessionId(201L)
                .expenseId(expenseId)
                .roomName("C102회식")
                .requesterUserId(1L)
                .requesterUserName("류병선")
                .payerUserId(payerUserId)
                .payerUserName("김수연")
                .payableAmount(20000)
                .status(status)
                .createdAt(createdAt)
                .build();
    }

    private ExpenseItem createExpenseItem(Long expenseItemId, Expense expense, String name) {
        ExpenseItem item = ExpenseItem.builder()
                .expense(expense)
                .name(name)
                .quantity(1)
                .totalAmount(10000)
                .build();
        ReflectionTestUtils.setField(item, "id", expenseItemId);
        return item;
    }

    private ExpenseItemParticipant createItemParticipant(ExpenseItem item, Long userId, int quantity, int splitAmount) {
        return ExpenseItemParticipant.builder()
                .expenseItem(item)
                .userId(userId)
                .userName("김수연")
                .userTag("#B7")
                .profileImageUrl(null)
                .quantity(quantity)
                .splitAmount(splitAmount)
                .build();
    }
}
