package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.StartRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
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
    private final RoomSessionRepository roomSessionRepository;

    @Override
    @Transactional
    public CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request) {
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
    @Transactional
    public UpdateAutoDebitConsentResponse toggleAutoDebitConsent(
            Long roomId,
            Long currentUserId
    ) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 자동이체 동의 여부를 변경할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        participant.updateAgreement(!participant.isAgreed());

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
            throw new CustomException(ErrorCode.ROOM_NOT_ADMIN); // 방장만 모임 정보를 수정할 수 있다.
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

    /*
     * [ROOM-17] 모임을 시작한다.
     * @param roomId        모임방 ID
     * @param currentUserId 현재 인증된 사용자 ID
     * @param request       카테고리와 세부 내용이 담긴 요청 DTO
     */
    @Override
    @Transactional
    public void startRoom(Long roomId, Long currentUserId, StartRoomRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        // 논리 삭제된 방에서의 시작을 방지한다.
        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        // 멤버 확인: 일반 멤버도 시작 가능하므로 isAdmin 체크는 하지 않는다.
        roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 모임을 시작할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        // 이미 진행 중인 모임은 다시 시작할 수 없다.
        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_HAS_REQUESTED_EXPENSE);
        }

        // 이전 회차에서 정산 요청 중(REQUESTED)인 결제가 남아 있으면
        // 정산이 완료되기 전까지 새 모임을 시작할 수 없다.
        validateNoRequestedExpenses(roomId);

        // 모임 시작 시 사용자가 입력한 카테고리(태그)와 세부 내용으로 방 정보를 업데이트한다.
        // 모임 이름은 시작 시 수정할 수 없으므로 건드리지 않는다.
        room.updateRoomDetails(request.getCategory(), request.getDescription());

        // isProgress 플래그를 true로 전환하여 모임 진행 상태로 변경한다.
        room.markInProgress();

        // 새로운 회차(RoomSession)를 생성하여 시작 시점을 기록한다.
        // startedAt은 @PrePersist에서 자동 설정된다.
        RoomSession session = RoomSession.builder()
                .room(room)
                .build();
        roomSessionRepository.save(session);
    }

    /*
     * [ROOM-18] 모임을 종료한다.
     * @param roomId        모임방 ID
     * @param currentUserId 현재 인증된 사용자 ID
     */
    @Override
    @Transactional
    public void endRoom(Long roomId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        // 논리 삭제된 방에서의 종료를 방지한다.
        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        // 멤버 확인: 일반 멤버도 종료 가능하므로 isAdmin 체크는 하지 않는다.
        roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 모임을 종료할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY
                ));

        // 이미 종료된(대기 중인) 모임은 다시 종료할 수 없다.
        if (!room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_HAS_REQUESTED_EXPENSE);
        }

        // 정산 요청 중(REQUESTED)인 결제가 남아 있으면 종료할 수 없다.
        // 모든 정산이 완료(SETTLED)되거나 아직 요청되지 않은(PENDING) 상태여야 한다.
        validateNoRequestedExpenses(roomId);

        // 활성 세션(endedAt이 null인 세션)을 찾아 종료 처리한다.
        // finalCategory에 현재 방의 카테고리를 스냅샷으로 저장한다.
        RoomSession activeSession = roomSessionRepository.findByRoomIdAndEndedAtIsNull(roomId)
                .orElse(null);

        if (activeSession != null) {
            activeSession.endSession(room.getCategory());
        }

        // isProgress 플래그를 false로 전환하여 대기 상태로 복귀한다.
        room.markReady();
    }

    /*
     * 해당 모임방에 정산 요청 중(REQUESTED) 상태인 결제가 존재하는지 검증한다.
     * 존재하면 409 Conflict 예외를 던져 모임 시작/종료를 차단한다.

     */
    private void validateNoRequestedExpenses(Long roomId) {
        long requestedCount = expenseRepository.countByRoomIdAndStatus(roomId, "REQUESTED");
        if (requestedCount > 0) {
            throw new CustomException(ErrorCode.ROOM_HAS_REQUESTED_EXPENSE);
        }
    }
}
