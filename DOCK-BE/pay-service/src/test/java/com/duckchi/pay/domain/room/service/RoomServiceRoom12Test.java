package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseParticipantCountProjection;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseTitleProjection;
import com.duckchi.pay.domain.room.dto.response.RoomMySetResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomSession;
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
class RoomServiceRoom12Test {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private ExpenseParticipantRepository expenseParticipantRepository;

    @Mock
    private SettlementRepository settlementRepository;

    @Mock
    private RoomSessionRepository roomSessionRepository;

    @Mock
    private CoreClient coreClient;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void getMySet_activeSession_success() {
        Room room = createRoom(101L);
        RoomSession activeSession = createSession(201L, room, true);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);
        when(roomSessionRepository.findByRoom_IdAndEndedAtIsNull(101L)).thenReturn(Optional.of(activeSession));

        Settlement settlement = createSettlement(981302L, 981207L, 7L, "류병선", 20000, "PENDING");
        when(settlementRepository.findByRoomIdAndRoomSessionIdAndPayerUserIdOrderByCreatedAtDescIdDesc(101L, 201L, 7L))
                .thenReturn(List.of(settlement));
        when(expenseRepository.sumTotalAmountByRoomIdAndRoomSessionId(101L, 201L)).thenReturn(180000L);
        when(expenseRepository.findExpenseTitlesByIds(List.of(981207L)))
                .thenReturn(List.of(expenseTitle(981207L, "고기집")));
        when(expenseParticipantRepository.countParticipantsByExpenseIds(List.of(981207L)))
                .thenReturn(List.of(participantCount(981207L, 6L)));
        when(settlementRepository.sumPendingPayableAmountByRoomSessionAndPayer(101L, 201L, 7L)).thenReturn(20000L);

        RoomMySetResponse result = roomService.getMySet(101L, 7L);

        assertEquals(20000, result.myTotal());
        assertEquals(180000, result.roomTotalAmount());
        assertEquals(1, result.mySet().size());
        assertEquals(981302L, result.mySet().get(0).settlementId());
        assertEquals("고기집", result.mySet().get(0).title());
        assertEquals(6, result.mySet().get(0).setUserCount());
        assertEquals(false, result.mySet().get(0).isCompleted());
        assertNotNull(result.mySet().get(0).requestedAt());
    }

    @Test
    void getMySet_noActiveSession_fallbackLatestSession_success() {
        Room room = createRoom(101L);
        RoomSession latestSession = createSession(202L, room, false);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);
        when(roomSessionRepository.findByRoom_IdAndEndedAtIsNull(101L)).thenReturn(Optional.empty());
        when(roomSessionRepository.findTopByRoom_IdOrderByStartedAtDesc(101L)).thenReturn(Optional.of(latestSession));
        when(settlementRepository.findByRoomIdAndRoomSessionIdAndPayerUserIdOrderByCreatedAtDescIdDesc(101L, 202L, 7L))
                .thenReturn(List.of());
        when(expenseRepository.sumTotalAmountByRoomIdAndRoomSessionId(101L, 202L)).thenReturn(50000L);

        RoomMySetResponse result = roomService.getMySet(101L, 7L);

        assertEquals(0, result.myTotal());
        assertEquals(50000, result.roomTotalAmount());
        assertEquals(0, result.mySet().size());
    }

    @Test
    void getMySet_noSession_returnsEmptyResponse() {
        Room room = createRoom(101L);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);
        when(roomSessionRepository.findByRoom_IdAndEndedAtIsNull(101L)).thenReturn(Optional.empty());
        when(roomSessionRepository.findTopByRoom_IdOrderByStartedAtDesc(101L)).thenReturn(Optional.empty());

        RoomMySetResponse result = roomService.getMySet(101L, 7L);

        assertEquals(0, result.myTotal());
        assertEquals(0, result.roomTotalAmount());
        assertEquals(0, result.mySet().size());
    }

    @Test
    void getMySet_notMember_throwsForbidden() {
        Room room = createRoom(101L);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class, () -> roomService.getMySet(101L, 7L));

        assertEquals(ErrorCode.ROOM_MEMBER_ONLY, ex.getErrorCode());
    }

    private Room createRoom(Long roomId) {
        Room room = Room.builder()
                .name("테스트방")
                .category("기타")
                .description("설명")
                .isProgress(true)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }

    private RoomSession createSession(Long sessionId, Room room, boolean active) {
        RoomSession session = RoomSession.builder()
                .room(room)
                .startedAt(LocalDateTime.now().minusHours(1))
                .endedAt(active ? null : LocalDateTime.now())
                .finalCategory(active ? null : "회식")
                .build();
        ReflectionTestUtils.setField(session, "id", sessionId);
        return session;
    }

    private Settlement createSettlement(
            Long settlementId,
            Long expenseId,
            Long payerUserId,
            String requesterUserName,
            int payableAmount,
            String status
    ) {
        return Settlement.builder()
                .id(settlementId)
                .roomId(101L)
                .roomSessionId(201L)
                .expenseId(expenseId)
                .roomName("테스트방")
                .requesterUserId(1L)
                .requesterUserName(requesterUserName)
                .payerUserId(payerUserId)
                .payerUserName("임찬혁")
                .payableAmount(payableAmount)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private ExpenseTitleProjection expenseTitle(Long expenseId, String title) {
        return new ExpenseTitleProjection() {
            @Override
            public Long getExpenseId() {
                return expenseId;
            }

            @Override
            public String getTitle() {
                return title;
            }
        };
    }

    private ExpenseParticipantCountProjection participantCount(Long expenseId, Long count) {
        return new ExpenseParticipantCountProjection() {
            @Override
            public Long getExpenseId() {
                return expenseId;
            }

            @Override
            public Long getParticipantCount() {
                return count;
            }
        };
    }
}
