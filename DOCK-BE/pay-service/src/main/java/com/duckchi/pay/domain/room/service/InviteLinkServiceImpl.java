package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.JoinRoomByInviteResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;
import com.duckchi.pay.domain.room.entity.InviteLink;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.InviteLinkRepository;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.type.InviteLinkStatus;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InviteLinkServiceImpl implements InviteLinkService {

    private static final int EXPIRE_DAYS = 3;
    private static final String DEFAULT_INVITE_BASE_URL = "duckchi://invite";
    private static final int TOKEN_RETRY_LIMIT = 5;
    private static final int MAX_TOKEN_LENGTH = 64;

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final InviteLinkRepository inviteLinkRepository;

    @Override
    @Transactional
    public CreateInviteLinkResponse createInviteLink(Long roomId, Long currentUserId) {
        // 컨트롤러에서 전달한 인증 userId가 없으면 비인증 요청으로 차단한다.
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        // 동시 요청에서 방 단위로 링크를 1건만 발급/재사용하도록 row lock을 먼저 획득한다.
        Room room = roomRepository.findByIdForUpdate(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (!roomParticipantRepository.existsByRoom_IdAndUserId(roomId, currentUserId)) {
            throw new CustomException(ErrorCode.ROOM_MEMBER_ONLY);
        }

        LocalDateTime now = LocalDateTime.now();
        Optional<InviteLink> latestOpt = inviteLinkRepository.findTopByRoom_IdOrderByCreatedAtDesc(roomId);

        boolean regenerated = false;
        InviteLink target;
        if (latestOpt.isPresent() && latestOpt.get().isActive() && !latestOpt.get().isExpired(now)) {
            target = latestOpt.get();
        } else {
            // 기존 링크가 있던 경우에만 regenerated=true로 내려 FE가 재발급 UX를 구분할 수 있게 한다.
            regenerated = latestOpt.isPresent();
            target = inviteLinkRepository.save(
                    InviteLink.create(room, generateUniqueToken(), now.plusDays(EXPIRE_DAYS))
            );
        }

        InviteLinkStatus status = target.resolveStatus(now);
        return CreateInviteLinkResponse.builder()
                .roomId(room.getId())
                .inviteLink(buildInviteLink(target.getToken()))
                .inviteToken(target.getToken())
                .status(status.name())
                .expiresAt(target.getExpiresAt())
                .regenerated(regenerated)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ValidateInviteLinkResponse validateInviteLink(String inviteToken, Long currentUserId) {
        if (inviteToken == null || inviteToken.isBlank() || inviteToken.length() > MAX_TOKEN_LENGTH) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        InviteLink inviteLink = inviteLinkRepository.findByToken(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_INVALID_INVITE_LINK));

        LocalDateTime now = LocalDateTime.now();
        if (!inviteLink.isActive() || inviteLink.isExpired(now)) {
            throw new CustomException(ErrorCode.ROOM_INVALID_INVITE_LINK);
        }

        boolean alreadyParticipant = currentUserId != null
                && roomParticipantRepository.existsByRoom_IdAndUserId(inviteLink.getRoom().getId(), currentUserId);

        // 이미 참여자인 경우도 링크 자체는 유효하므로 예외 대신 플래그로 내려 FE가 즉시 방 진입을 결정하게 한다.
        return ValidateInviteLinkResponse.of(
                true,
                inviteLink.getRoom().getId(),
                inviteLink.getRoom().getName(),
                alreadyParticipant
        );
    }


    @Override
    @Transactional
    public JoinRoomByInviteResponse joinByInviteToken(String inviteToken, Long currentUserId) {
        if (inviteToken == null || inviteToken.isBlank() || inviteToken.length() > MAX_TOKEN_LENGTH) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        InviteLink inviteLink = inviteLinkRepository.findByTokenForUpdate(inviteToken)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_INVALID_INVITE_LINK));

        LocalDateTime now = LocalDateTime.now();
        if (!inviteLink.isActive() || inviteLink.isExpired(now)) {
            throw new CustomException(ErrorCode.ROOM_INVALID_INVITE_LINK);
        }

        Long roomId = inviteLink.getRoom().getId();
        if (roomParticipantRepository.existsByRoom_IdAndUserId(roomId, currentUserId)) {
            throw new CustomException(ErrorCode.ROOM_ALREADY_PARTICIPANT);
        }

        RoomParticipant participant = RoomParticipant.builder()
                .room(inviteLink.getRoom())
                .userId(currentUserId)
                .isAdmin(false)
                .isAgreed(false)
                .build();

        roomParticipantRepository.save(participant);

        // 참가 row 저장 성공과 링크 사용량 증가를 같은 트랜잭션으로 묶어 정합성을 보장한다.
        inviteLink.increaseUsedCount();

        return JoinRoomByInviteResponse.builder()
                .roomId(roomId)
                .userId(currentUserId)
                .isAdmin(false)
                .isAgreed(false)
                .joinedAt(now)
                .build();
    }

    private String generateUniqueToken() {
        for (int i = 0; i < TOKEN_RETRY_LIMIT; i++) {
            String token = UUID.randomUUID().toString().replace("-", "");
            if (!inviteLinkRepository.existsByToken(token)) {
                return token;
            }
        }
        throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
    }

    private String buildInviteLink(String token) {
        return DEFAULT_INVITE_BASE_URL + "/" + token;
    }
}
