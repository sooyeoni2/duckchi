package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class RoomServiceRoom04Test {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void updateAutoDebitConsent_agreed_success() {
        Room room = createRoom(101L);
        RoomParticipant participant = createParticipant(room, 7L, false, false);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(Optional.of(participant));

        UpdateAutoDebitConsentResponse result = roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.AGREED);

        assertTrue(participant.isAgreed());
        assertEquals(101L, result.getRoomId());
        assertEquals(7L, result.getUserId());
        assertEquals("MEMBER", result.getRole());
        assertTrue(result.isAgreed());
    }

    @Test
    void updateAutoDebitConsent_declined_success() {
        Room room = createRoom(101L);
        RoomParticipant participant = createParticipant(room, 7L, true, true);

        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(Optional.of(participant));

        UpdateAutoDebitConsentResponse result = roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.DECLINED);

        assertFalse(participant.isAgreed());
        assertEquals("ADMIN", result.getRole());
        assertFalse(result.isAgreed());
    }

    @Test
    void updateAutoDebitConsent_withoutHeader_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.updateAutoDebitConsent(101L, null, AutoDebitConsentStatus.AGREED));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(roomRepository, never()).findById(anyLong());
    }

    @Test
    void updateAutoDebitConsent_roomNotFound_throwsNotFound() {
        when(roomRepository.findById(101L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.AGREED));

        assertEquals(ErrorCode.ROOM_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void updateAutoDebitConsent_nonParticipant_throwsForbiddenWithRoom04Message() {
        Room room = createRoom(101L);
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.findByRoom_IdAndUserId(101L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> roomService.updateAutoDebitConsent(101L, 7L, AutoDebitConsentStatus.AGREED));

        assertEquals(ErrorCode.ROOM_MEMBER_ONLY, ex.getErrorCode());
        assertEquals("해당 모임의 멤버만 자동이체 동의/거절을 변경할 수 있습니다.", ex.getMessage());
    }

    private Room createRoom(Long roomId) {
        Room room = Room.builder()
                .name("테스트방")
                .category("기타")
                .description("설명")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
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