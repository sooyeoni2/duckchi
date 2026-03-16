package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
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

    @InjectMocks
    private RoomServiceImpl roomService;

    @Test
    void createRoom_success_defaultsCategoryAndCreatesOwnerParticipant() {
        CreateRoomRequest request = new CreateRoomRequest();
        ReflectionTestUtils.setField(request, "name", "제주여행");
        ReflectionTestUtils.setField(request, "category", null);
        ReflectionTestUtils.setField(request, "description", "C102뒷풀이");

        Room persisted = Room.builder()
                .name("제주여행")
                .category("기타")
                .description("C102뒷풀이")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(persisted, "id", 101L);

        when(roomRepository.save(any(Room.class))).thenReturn(persisted);

        CreateRoomResponse result = roomService.createRoom(7L, request);

        assertEquals(101L, result.getRoomId());
        assertEquals("제주여행", result.getName());
        assertEquals("기타", result.getCategory());
        assertEquals("READY", result.getStatus());

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
}
