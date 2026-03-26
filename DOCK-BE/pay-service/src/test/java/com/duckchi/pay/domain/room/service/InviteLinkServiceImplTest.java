package com.duckchi.pay.domain.room.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.JoinRoomByInviteResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;
import com.duckchi.pay.domain.room.entity.InviteLink;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.InviteLinkRepository;
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
class InviteLinkServiceImplTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private InviteLinkRepository inviteLinkRepository;

    @InjectMocks
    private InviteLinkServiceImpl inviteLinkService;

    @Test
    void createInviteLink_success_reusesActiveLink() {
        Room room = createRoom(101L);
        InviteLink activeLink = InviteLink.create(room, "active-token", LocalDateTime.now().plusDays(1));

        when(roomRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);
        when(inviteLinkRepository.findTopByRoom_IdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(activeLink));

        CreateInviteLinkResponse result = inviteLinkService.createInviteLink(101L, 7L);

        assertEquals("active-token", result.getInviteToken());
        assertEquals("ACTIVE", result.getStatus());
        assertFalse(result.isRegenerated());
        verify(inviteLinkRepository, never()).save(any(InviteLink.class));
    }

    @Test
    void createInviteLink_success_regeneratesWhenLatestExpired() {
        Room room = createRoom(101L);
        InviteLink expiredLink = InviteLink.create(room, "expired-token", LocalDateTime.now().minusSeconds(1));

        when(roomRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);
        when(inviteLinkRepository.findTopByRoom_IdOrderByCreatedAtDesc(101L)).thenReturn(Optional.of(expiredLink));
        when(inviteLinkRepository.existsByToken(any())).thenReturn(false);
        when(inviteLinkRepository.save(any(InviteLink.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateInviteLinkResponse result = inviteLinkService.createInviteLink(101L, 7L);

        assertTrue(result.isRegenerated());
        assertEquals("ACTIVE", result.getStatus());
        assertNotEquals("expired-token", result.getInviteToken());
        assertTrue(result.getInviteLink().endsWith(result.getInviteToken()));
        verify(inviteLinkRepository).save(any(InviteLink.class));
    }

    @Test
    void createInviteLink_withoutUserHeader_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.createInviteLink(101L, null));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(roomRepository, never()).findByIdForUpdate(any());
    }

    @Test
    void createInviteLink_withoutParticipant_throwsForbidden() {
        Room room = createRoom(101L);

        when(roomRepository.findByIdForUpdate(101L)).thenReturn(Optional.of(room));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.createInviteLink(101L, 7L));

        assertEquals(ErrorCode.ROOM_MEMBER_ONLY, ex.getErrorCode());
    }

    @Test
    void createInviteLink_withoutRoom_throwsNotFound() {
        when(roomRepository.findByIdForUpdate(101L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.createInviteLink(101L, 7L));

        assertEquals(ErrorCode.ROOM_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void validateInviteLink_success_withoutHeader_returnsValidTrue() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "valid-token", LocalDateTime.now().plusDays(1));

        when(inviteLinkRepository.findByToken("valid-token")).thenReturn(Optional.of(inviteLink));

        ValidateInviteLinkResponse result = inviteLinkService.validateInviteLink("valid-token", null);

        assertTrue(result.isValid());
        assertEquals(101L, result.getRoomId());
        assertEquals("테스트방", result.getRoomName());
        assertFalse(result.isAlreadyParticipant());
    }

    @Test
    void validateInviteLink_notFound_throwsInvalidInviteLink() {
        when(inviteLinkRepository.findByToken("missing-token")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.validateInviteLink("missing-token", null));

        assertEquals(ErrorCode.ROOM_INVALID_INVITE_LINK, ex.getErrorCode());
    }

    @Test
    void validateInviteLink_expired_throwsInvalidInviteLink() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "expired-token", LocalDateTime.now().minusSeconds(1));

        when(inviteLinkRepository.findByToken("expired-token")).thenReturn(Optional.of(inviteLink));

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.validateInviteLink("expired-token", null));

        assertEquals(ErrorCode.ROOM_INVALID_INVITE_LINK, ex.getErrorCode());
    }

    @Test
    void validateInviteLink_alreadyParticipant_returnsFlagTrue() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "valid-token", LocalDateTime.now().plusDays(1));

        when(inviteLinkRepository.findByToken("valid-token")).thenReturn(Optional.of(inviteLink));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 7L)).thenReturn(true);

        ValidateInviteLinkResponse result = inviteLinkService.validateInviteLink("valid-token", 7L);

        assertTrue(result.isValid());
        assertEquals(101L, result.getRoomId());
        assertEquals("테스트방", result.getRoomName());
        assertTrue(result.isAlreadyParticipant());
    }

    @Test
    void validateInviteLink_tooLongToken_throwsInvalidInput() {
        String tooLongToken = "a".repeat(65);

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.validateInviteLink(tooLongToken, null));

        assertEquals(ErrorCode.COMMON_INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    void joinByInviteToken_success_createsParticipantAndIncreasesUsedCount() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "join-token", LocalDateTime.now().plusDays(1));

        when(inviteLinkRepository.findByTokenForUpdate("join-token")).thenReturn(Optional.of(inviteLink));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 8L)).thenReturn(false);

        JoinRoomByInviteResponse result = inviteLinkService.joinByInviteToken("join-token", 8L);

        assertEquals(101L, result.getRoomId());
        assertEquals(8L, result.getUserId());
        assertFalse(result.isAdmin());
        assertFalse(result.isAgreed());
        assertEquals(1, inviteLink.getUsedCount());
        verify(roomParticipantRepository).save(any());
    }

    @Test
    void joinByInviteToken_alreadyParticipant_throwsConflict() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "join-token", LocalDateTime.now().plusDays(1));

        when(inviteLinkRepository.findByTokenForUpdate("join-token")).thenReturn(Optional.of(inviteLink));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(101L, 8L)).thenReturn(true);

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.joinByInviteToken("join-token", 8L));

        assertEquals(ErrorCode.ROOM_ALREADY_PARTICIPANT, ex.getErrorCode());
        verify(roomParticipantRepository, never()).save(any());
    }

    @Test
    void joinByInviteToken_withoutUser_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.joinByInviteToken("join-token", null));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
        verify(inviteLinkRepository, never()).findByTokenForUpdate(any());
    }

    @Test
    void joinByInviteToken_expired_throwsInvalidInviteLink() {
        Room room = createRoom(101L);
        InviteLink inviteLink = InviteLink.create(room, "join-token", LocalDateTime.now().minusSeconds(1));

        when(inviteLinkRepository.findByTokenForUpdate("join-token")).thenReturn(Optional.of(inviteLink));

        CustomException ex = assertThrows(CustomException.class,
                () -> inviteLinkService.joinByInviteToken("join-token", 8L));

        assertEquals(ErrorCode.ROOM_INVALID_INVITE_LINK, ex.getErrorCode());
        verify(roomParticipantRepository, never()).save(any());
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
}
