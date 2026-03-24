package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.repository.projection.RoomExpenseSummaryProjection;
import com.duckchi.pay.domain.room.repository.projection.RoomParticipantUserProjection;
import com.duckchi.pay.domain.room.repository.projection.RoomSettlementSummaryProjection;
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
class RoomServiceImplTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private BadgeTriggerService badgeTriggerService;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void createRoom_success_defaultsCategoryAndCreatesOwnerParticipant() {
        CreateRoomRequest request = new CreateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "제주여행");
        ReflectionTestUtils.setField(request, "category", null);
        ReflectionTestUtils.setField(request, "description", "C102 룸");

        Room persisted = Room.builder()
                .name("제주여행")
                .category("기타")
                .description("C102 룸")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(persisted, "id", 101L);

        when(roomRepository.save(any(Room.class))).thenReturn(persisted);

        CreateRoomResponse result = roomService.createRoom(7L, request);

        assertEquals(101L, result.getRoomId());
        assertEquals("제주여행", result.getName());
        assertEquals("기타", result.getCategory());
        assertEquals(false, result.isProgress());

        ArgumentCaptor<RoomParticipant> participantCaptor = ArgumentCaptor.forClass(RoomParticipant.class);
        verify(roomParticipantRepository).save(participantCaptor.capture());
        assertTrue(participantCaptor.getValue().isAdmin());
        assertTrue(participantCaptor.getValue().isAgreed());
    }

    @Test
    void createRoom_withoutUserHeader_throwsUnauthorized() {
        CreateRoomRequest request = new CreateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "테스트방");

        CustomException ex = assertThrows(CustomException.class, () -> roomService.createRoom(null, request));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(roomRepository, never()).save(any(Room.class));
    }

    @Test
    void getRoomLists_success_mergesRoomParticipantAndSummaryData() {
        Room room = Room.builder()
                .name("C102회식")
                .category("여행")
                .isProgress(true)
                .build();
        ReflectionTestUtils.setField(room, "id", 101L);

        when(roomRepository.findParticipatingRooms(7L, true)).thenReturn(List.of(room));
        when(roomParticipantRepository.findParticipantUserMappingsByRoomIds(List.of(101L)))
                .thenReturn(List.of(
                        participantProjection(101L, 1L),
                        participantProjection(101L, 2L),
                        participantProjection(101L, 3L)
                ));
        when(expenseRepository.findRoomExpenseSummaries(List.of(101L)))
                .thenReturn(List.of(expenseProjection(101L, 180000L, 2L)));
        when(roomRepository.findRoomSettlementSummaries(List.of(101L)))
                .thenReturn(List.of(settlementProjection(101L, 3L, 4L)));

        List<RoomListResponse> result = roomService.getRoomLists(7L, true);

        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).getRoomId());
        assertEquals("C102회식", result.get(0).getRoomName());
        assertEquals("여행", result.get(0).getCategory());
        assertEquals(true, result.get(0).isProgress());
        assertEquals(3, result.get(0).getParticipants().size());
        assertEquals(3, result.get(0).getParticipantCount());
        assertEquals(180000, result.get(0).getTotalPay());
        assertEquals(2, result.get(0).getPayCount());
        assertEquals(75, result.get(0).getPercent());
    }

    @Test
    void getRoomLists_withoutUserHeader_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class, () -> roomService.getRoomLists(null, null));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(roomRepository, never()).findParticipatingRooms(any(), any());
    }

    @Test
    void updateRoomInfo_success_updatesNameAndCategory() {
        UpdateRoomRequest request = new UpdateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "새로운이름");
        ReflectionTestUtils.setField(request, "category", "새로운카테고리");

        Room room = Room.builder()
                .name("이전이름")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant owner = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(true)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(owner));

        roomService.updateRoomInfo(101L, 7L, request);

        assertEquals("새로운이름", room.getName());
        assertEquals("새로운카테고리", room.getCategory());
    }

    @Test
    void updateRoomInfo_whenInProgress_throwsCustomException() {
        UpdateRoomRequest request = new UpdateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "새로운이름");

        Room room = Room.builder()
                .isProgress(true)
                .build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant owner = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(true)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(owner));

        CustomException ex = assertThrows(CustomException.class, () -> roomService.updateRoomInfo(101L, 7L, request));
        assertEquals(ErrorCode.ROOM_CANNOT_UPDATE_STATUS, ex.getErrorCode());
    }

    @Test
    void updateRoomInfo_notAdmin_throwsCustomException() {
        UpdateRoomRequest request = new UpdateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "새로운이름");

        Room room = Room.builder()
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant member = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(false)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(member));

        CustomException ex = assertThrows(CustomException.class, () -> roomService.updateRoomInfo(101L, 7L, request));
        assertEquals(ErrorCode.ROOM_NOT_ADMIN, ex.getErrorCode());
    }

    @Test
    void updateRoomInfo_partialUpdateOnlyNameNullCategory_success() {
        UpdateRoomRequest request = new UpdateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "이름만수정");
        ReflectionTestUtils.setField(request, "category", null);

        Room room = Room.builder()
                .name("이전이름")
                .category("이전카테고리")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant owner = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(true)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(owner));

        roomService.updateRoomInfo(101L, 7L, request);

        assertEquals("이름만수정", room.getName());
        assertEquals("이전카테고리", room.getCategory());
    }

    @Test
    void leaveRoom_success() {
        Room room = Room.builder().isProgress(false).build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant member = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(false)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(member));

        roomService.leaveRoom(101L, 7L);

        verify(roomParticipantRepository).delete(member);
    }

    @Test
    void deleteRoom_success_softDeletesRoom() {
        Room room = Room.builder().isProgress(false).build();
        ReflectionTestUtils.setField(room, "id", 101L);

        RoomParticipant admin = RoomParticipant.builder()
                .room(room)
                .userId(7L)
                .isAdmin(true)
                .build();

        when(roomRepository.findById(101L)).thenReturn(java.util.Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(java.util.Optional.of(admin));

        roomService.deleteRoom(101L, 7L);

        assertTrue(room.getDeletedAt() != null);
    }

    private RoomParticipantUserProjection participantProjection(Long roomId, Long userId) {
        return new RoomParticipantUserProjection() {
            @Override
            public Long getRoomId() {
                return roomId;
            }

            @Override
            public Long getUserId() {
                return userId;
            }
        };
    }

    private RoomExpenseSummaryProjection expenseProjection(Long roomId, Long totalPay, Long payCount) {
        return new RoomExpenseSummaryProjection() {
            @Override
            public Long getRoomId() {
                return roomId;
            }

            @Override
            public Long getTotalPay() {
                return totalPay;
            }

            @Override
            public Long getPayCount() {
                return payCount;
            }
        };
    }

    private RoomSettlementSummaryProjection settlementProjection(Long roomId, Long completedCount, Long targetCount) {
        return new RoomSettlementSummaryProjection() {
            @Override
            public Long getRoomId() {
                return roomId;
            }

            @Override
            public Long getCompletedCount() {
                return completedCount;
            }

            @Override
            public Long getTargetCount() {
                return targetCount;
            }
        };
    }
}
