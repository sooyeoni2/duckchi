package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.repository.projection.RoomExpenseSummaryProjection;
import com.duckchi.pay.domain.room.repository.projection.RoomParticipantUserProjection;
import com.duckchi.pay.domain.room.repository.projection.RoomSettlementSummaryProjection;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private static final String DEFAULT_CATEGORY = "기타";

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final ExpenseRepository expenseRepository;

    @Override
    @Transactional
    public CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request) {
        // 컨트롤러에서 JWT 기반으로 해석된 userId가 없으면 비인증 요청으로 차단한다.
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = Room.builder()
                .name(request.getName().trim())
                .category(normalizeCategory(request.getCategory()))
                .description(request.getDescription())
                .isProgress(false)
                .build();

        Room savedRoom = roomRepository.save(room);

        RoomParticipant owner = RoomParticipant.builder()
                .room(savedRoom)
                .userId(currentUserId)
                // 방 생성자는 이후 ROOM-02/04 흐름의 기준 주체이므로 생성 시점에 관리자/동의 상태로 저장한다.
                .isAdmin(true)
                .isAgreed(true)
                .build();

        roomParticipantRepository.save(owner);

        return CreateRoomResponse.from(savedRoom);
    }

    @Override
    @Transactional
    public UpdateAutoDebitConsentResponse updateAutoDebitConsent(
            Long roomId,
            Long currentUserId,
            AutoDebitConsentStatus status
    ) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                // ROOM-02와 같은 에러코드를 재사용하되 ROOM-04 명세 문구를 맞추기 위해 메시지를 오버라이드한다.
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 자동이체 동의/거절을 변경할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        participant.updateAgreement(status.toAgreement());

        return UpdateAutoDebitConsentResponse.builder()
                .roomId(roomId)
                .userId(currentUserId)
                .role(participant.isAdmin() ? "ADMIN" : "MEMBER")
                .isAgreed(participant.isAgreed())
                .build();
    }

    @Override
    public List<RoomListResponse> getRoomLists(Long currentUserId, Boolean isProgress) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        List<Room> rooms = roomRepository.findParticipatingRooms(currentUserId, isProgress);
        if (rooms.isEmpty()) {
            return List.of();
        }

        List<Long> roomIds = rooms.stream().map(Room::getId).toList();

        // roomId 단위 배치 조회로 참여자/결제/정산 집계를 한 번에 가져와 N+1을 방지한다.
        Map<Long, List<Long>> participantsByRoomId = roomParticipantRepository.findParticipantUserMappingsByRoomIds(roomIds)
                .stream()
                .collect(Collectors.groupingBy(
                        RoomParticipantUserProjection::getRoomId,
                        Collectors.mapping(RoomParticipantUserProjection::getUserId, Collectors.toList())
                ));

        Map<Long, RoomExpenseSummaryProjection> expenseSummaryByRoomId = expenseRepository.findRoomExpenseSummaries(roomIds)
                .stream()
                .collect(Collectors.toMap(RoomExpenseSummaryProjection::getRoomId, Function.identity()));

        Map<Long, RoomSettlementSummaryProjection> settlementSummaryByRoomId = roomRepository.findRoomSettlementSummaries(roomIds)
                .stream()
                .collect(Collectors.toMap(RoomSettlementSummaryProjection::getRoomId, Function.identity()));

        return rooms.stream()
                .map(room -> buildRoomListResponse(room, participantsByRoomId, expenseSummaryByRoomId, settlementSummaryByRoomId))
                .toList();
    }

    private RoomListResponse buildRoomListResponse(
            Room room,
            Map<Long, List<Long>> participantsByRoomId,
            Map<Long, RoomExpenseSummaryProjection> expenseSummaryByRoomId,
            Map<Long, RoomSettlementSummaryProjection> settlementSummaryByRoomId
    ) {
        List<Long> participants = participantsByRoomId.getOrDefault(room.getId(), List.of());

        RoomExpenseSummaryProjection expenseSummary = expenseSummaryByRoomId.get(room.getId());
        long totalPayValue = expenseSummary == null || expenseSummary.getTotalPay() == null
                ? 0L
                : expenseSummary.getTotalPay();
        long payCountValue = expenseSummary == null || expenseSummary.getPayCount() == null
                ? 0L
                : expenseSummary.getPayCount();

        RoomSettlementSummaryProjection settlementSummary = settlementSummaryByRoomId.get(room.getId());
        long completedCount = settlementSummary == null || settlementSummary.getCompletedCount() == null
                ? 0L
                : settlementSummary.getCompletedCount();
        long targetCount = settlementSummary == null || settlementSummary.getTargetCount() == null
                ? 0L
                : settlementSummary.getTargetCount();

        return RoomListResponse.builder()
                .roomId(room.getId())
                .roomName(room.getName())
                .category(room.getCategory())
                .isProgress(room.isProgress())
                .participants(participants)
                .participantCount(participants.size())
                .totalPay(safeLongToInt(totalPayValue))
                .payCount(safeLongToInt(payCountValue))
                .percent(calculatePercent(completedCount, targetCount))
                .build();
    }

    private int calculatePercent(long completedCount, long targetCount) {
        // 정산 대상이 없으면 0%로 고정해 division-by-zero와 의미 불명 케이스를 함께 차단한다.
        if (targetCount <= 0) {
            return 0;
        }
        return safeLongToInt((completedCount * 100) / targetCount);
    }

    private int safeLongToInt(long value) {
        if (value > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (value < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) value;
    }

    private String normalizeCategory(String category) {
        // DDL 기본값("기타")과 서비스 동작을 맞춰 DB 기본값 의존 없이 동일 결과를 보장한다.
        if (category == null || category.isBlank()) {
            return DEFAULT_CATEGORY;
        }
        return category.trim();
    }

    @Override
    @Transactional
    public void updateRoomInfo(Long roomId, Long currentUserId, UpdateRoomRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_ONLY));

        if (!participant.isAdmin()) {
            throw new CustomException(ErrorCode.ROOM_NOT_ADMIN);
        }

        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_CANNOT_UPDATE_STATUS);
        }

        room.updateRoomInfo(request.getName(), request.getCategory());
    }

    @Override
    @Transactional
    public void leaveRoom(Long roomId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_CANNOT_LEAVE_PROGRESS);
        }

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_ONLY));

        if (participant.isAdmin()) {
            throw new CustomException(ErrorCode.ROOM_ADMIN_DELEGATION_REQUIRED);
        }

        roomParticipantRepository.delete(participant);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_CANNOT_DELETE_PROGRESS);
        }

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_ONLY));

        if (!participant.isAdmin()) {
            throw new CustomException(ErrorCode.ROOM_NOT_ADMIN);
        }

        room.deleteRoom();
    }
}