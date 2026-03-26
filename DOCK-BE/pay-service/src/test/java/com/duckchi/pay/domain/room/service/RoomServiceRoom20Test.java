package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.room.dto.response.GetAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RoomServiceRoom20Test {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void getAutoDebitConsent_success_returnsConsentStateAndCounts() {
        Room room = createRoom(101L, false);
        RoomParticipant participant = createParticipant(room, 7L, false, true);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(Optional.of(participant));
        when(roomParticipantRepository.countByRoom_Id(101L)).thenReturn(6L);
        when(roomParticipantRepository.countByRoom_IdAndIsAgreedTrue(101L)).thenReturn(2L);

        GetAutoDebitConsentResponse result = roomService.getAutoDebitConsent(101L, 7L);

        assertEquals(101L, result.getRoomId());
        assertEquals(7L, result.getUserId());
        assertEquals("MEMBER", result.getRole());
        assertTrue(result.isAgreed());
        assertEquals(2, result.getAgreedCount());
        assertEquals(6, result.getParticipantCount());
        assertEquals(33, result.getConsentRate());
    }

    @Test
    void getAutoDebitConsent_withoutHeader_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.getAutoDebitConsent(101L, null));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(roomRepository, never()).findById(anyLong());
    }

    @Test
    void getAutoDebitConsent_roomNotFound_throwsNotFound() {
        when(roomRepository.findById(101L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.getAutoDebitConsent(101L, 7L));

        assertEquals(ErrorCode.ROOM_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getAutoDebitConsent_nonParticipant_throwsForbiddenWithRoom20Message() {
        Room room = createRoom(101L, false);
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.getAutoDebitConsent(101L, 7L));

        assertEquals(ErrorCode.ROOM_MEMBER_ONLY, ex.getErrorCode());
        assertEquals("해당 모임의 멤버만 자동이체 동의 상태를 조회할 수 있습니다.", ex.getMessage());
    }

    @Test
    void getAutoDebitConsent_deletedRoom_throwsNotFound() {
        Room room = createRoom(101L, true);
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.getAutoDebitConsent(101L, 7L));

        assertEquals(ErrorCode.ROOM_NOT_FOUND, ex.getErrorCode());
    }

    private Room createRoom(Long roomId, boolean deleted) {
        Room room = Room.builder()
                .name("테스트방")
                .category("기타")
                .description("설명")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        if (deleted) {
            ReflectionTestUtils.setField(room, "deletedAt", LocalDateTime.now());
        }
        return room;
    }

    private RoomParticipant createParticipant(Room room, Long userId, boolean isAdmin, boolean isAgreed) {
        return RoomParticipant.builder()
                .room(room)
                .userId(userId)
                .isAdmin(isAdmin)
                .isAgreed(isAgreed)
                .build();
    }
}

