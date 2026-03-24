package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.dto.external.UserProfileBatchRequest;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseItemParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.dto.event.RoomLifecycleNotificationEvent;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseParticipantCountProjection;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseTitleProjection;
import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.DelegateAdminRequest;
import com.duckchi.pay.domain.room.dto.request.StartRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.dto.response.RoomMySetItemResponse;
import com.duckchi.pay.domain.room.dto.response.RoomMySetResponse;
import com.duckchi.pay.domain.room.dto.response.RoomParticipantListResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementDetailResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementItemSplitResponse;
import com.duckchi.pay.domain.room.dto.response.RoomSettlementParticipantStatusResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.infra.client.CoreClient;
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
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.duckchi.pay.infra.kafka.service.OutboxEventCommandService;
import com.duckchi.pay.infra.kafka.type.KafkaTopicNames;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private static final String DEFAULT_CATEGORY = "기타";

    private static final String SETTLEMENT_COMPLETED_STATUS = "COMPLETED";
    private static final String SETTLEMENT_PENDING_STATUS = "PENDING";
    private static final String EXPENSE_PENDING_STATUS = "PENDING";
    private static final String INPUT_TYPE_OCR = "OCR";

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseParticipantRepository expenseParticipantRepository;
    private final ExpenseItemParticipantRepository expenseItemParticipantRepository;
    private final SettlementRepository settlementRepository;
    private final RoomSessionRepository roomSessionRepository;
    private final CoreClient coreClient;
    private final BadgeTriggerService badgeTriggerService;
    private final OutboxEventCommandService outboxEventCommandService;

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

        // [BADGE 트리거] 방 생성 시 뱃지 진행도 갱신 (ALLEY_BOSS +1, INSSA_DUCK +1)
        badgeTriggerService.triggerRoomCreated(currentUserId);

        return CreateRoomResponse.from(savedRoom);
    }

    @Override
    @Transactional
    public UpdateAutoDebitConsentResponse updateAutoDebitConsent(
            Long roomId,
            Long currentUserId,
            AutoDebitConsentStatus status) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 자동이체 동의/거절을 변경할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY));

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
            Long currentUserId) {
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
                        ErrorCode.ROOM_MEMBER_ONLY));

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

        Map<Long, List<Long>> participantsByRoomId = roomParticipantRepository
                .findParticipantUserMappingsByRoomIds(roomIds)
                .stream()
                .collect(Collectors.groupingBy(
                        RoomParticipantUserProjection::getRoomId,
                        Collectors.mapping(RoomParticipantUserProjection::getUserId, Collectors.toList())));

        Map<Long, RoomExpenseSummaryProjection> expenseSummaryByRoomId = expenseRepository
                .findRoomExpenseSummaries(roomIds)
                .stream()
                .collect(Collectors.toMap(RoomExpenseSummaryProjection::getRoomId, Function.identity()));

        Map<Long, RoomSettlementSummaryProjection> settlementSummaryByRoomId = roomRepository
                .findRoomSettlementSummaries(roomIds)
                .stream()
                .collect(Collectors.toMap(RoomSettlementSummaryProjection::getRoomId, Function.identity()));

        return rooms.stream()
                .map(room -> buildRoomListResponse(room, participantsByRoomId, expenseSummaryByRoomId,
                        settlementSummaryByRoomId))
                .toList();
    }

    @Override
    public RoomMySetResponse getMySet(Long roomId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        // ROOM-12는 방 멤버에게만 노출한다.
        if (!roomParticipantRepository.existsByRoom_IdAndUserId(roomId, currentUserId)) {
            throw new CustomException("해당 모임의 멤버만 내 정산 목록을 조회할 수 있습니다.", ErrorCode.ROOM_MEMBER_ONLY);
        }

        RoomSession targetSession = resolveTargetRoomSession(roomId);

        // 아직 생성된 회차가 없으면 빈 목록/0원으로 응답한다.
        if (targetSession == null) {
            return new RoomMySetResponse(0, List.of(), 0);
        }

        Long roomSessionId = targetSession.getId();
        List<Settlement> settlements = settlementRepository
                .findByRoomIdAndRoomSessionIdAndPayerUserIdOrderByCreatedAtDescIdDesc(
                        roomId,
                        roomSessionId,
                        currentUserId
                );

        long roomTotalAmount = safeLongValue(
                expenseRepository.sumTotalAmountByRoomIdAndRoomSessionId(roomId, roomSessionId));

        if (settlements.isEmpty()) {
            return new RoomMySetResponse(0, List.of(), safeLongToInt(roomTotalAmount));
        }

        List<Long> expenseIds = settlements.stream()
                .map(Settlement::getExpenseId)
                .distinct()
                .toList();

        // N+1 조회를 피하기 위해 결제 제목/참여자 수는 배치 조회로 읽는다.
        Map<Long, String> expenseTitleMap = expenseRepository.findExpenseTitlesByIds(expenseIds).stream()
                .collect(Collectors.toMap(
                        ExpenseTitleProjection::getExpenseId,
                        ExpenseTitleProjection::getTitle
                ));

        if (expenseTitleMap.size() != expenseIds.size()) {
            throw new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND);
        }

        Map<Long, Long> participantCountMap = new HashMap<>();
        List<ExpenseParticipantCountProjection> participantCounts =
                expenseParticipantRepository.countParticipantsByExpenseIds(expenseIds);

        for (ExpenseParticipantCountProjection projection : participantCounts) {
            participantCountMap.put(projection.getExpenseId(), safeLongValue(projection.getParticipantCount()));
        }

        List<RoomMySetItemResponse> mySet = settlements.stream()
                .map(settlement -> {
                    String expenseTitle = expenseTitleMap.get(settlement.getExpenseId());
                    if (expenseTitle == null) {
                        throw new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND);
                    }

                    int setUserCount = safeLongToInt(participantCountMap.getOrDefault(settlement.getExpenseId(), 0L));
                    Integer payableAmountValue = settlement.getPayableAmount();
                    int payableAmount = payableAmountValue == null ? 0 : payableAmountValue;

                    return new RoomMySetItemResponse(
                            settlement.getId(),
                            settlement.getExpenseId(),
                            expenseTitle,
                            settlement.getRequesterUserName(),
                            setUserCount,
                            payableAmount,
                            SETTLEMENT_COMPLETED_STATUS.equals(settlement.getStatus()),
                            settlement.getCreatedAt()
                    );
                })
                .toList();

        long myTotal = safeLongValue(
                settlementRepository.sumPendingPayableAmountByRoomSessionAndPayer(
                        roomId,
                        roomSessionId,
                        currentUserId
                ));

        return new RoomMySetResponse(
                safeLongToInt(myTotal),
                mySet,
                safeLongToInt(roomTotalAmount)
        );
    }

    @Override
    public RoomSettlementDetailResponse getSettlementDetail(Long roomId, Long expenseId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        if (!roomParticipantRepository.existsByRoom_IdAndUserId(roomId, currentUserId)) {
            throw new CustomException("해당 모임의 멤버만 정산 현황을 조회할 수 있습니다.", ErrorCode.ROOM_MEMBER_ONLY);
        }

        Expense expense = expenseRepository.findByIdAndRoomId(expenseId, roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND));

        // ROOM-13은 정산 요청이 생성된 결제(REQUESTED/SETTLED)만 조회를 허용한다.
        if (EXPENSE_PENDING_STATUS.equals(expense.getStatus())) {
            throw new CustomException(ErrorCode.SETTLEMENT_NOT_REQUESTED);
        }

        List<ExpenseParticipant> expenseParticipants =
                expenseParticipantRepository.findByExpense_IdOrderByIdAsc(expenseId);

        List<Settlement> settlements = settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(expenseId);

        Map<Long, Settlement> settlementByPayerUserId = settlements.stream()
                .collect(Collectors.toMap(
                        Settlement::getPayerUserId,
                        Function.identity(),
                        (existing, ignored) -> existing
                ));

        boolean isItemized = INPUT_TYPE_OCR.equals(expense.getInputType());
        Map<Long, List<RoomSettlementItemSplitResponse>> itemSplitsByUserId = isItemized
                ? buildItemSplitsByUserId(expenseId)
                : Map.of();

        // 요청자(총무) 본인 row는 settlement가 없어도 COMPLETED로 보정한다.
        Long requesterUserId = expense.getPayerUserId();
        List<RoomSettlementParticipantStatusResponse> participantResponses = new ArrayList<>();

        int completedCount = 0;
        int pendingCount = 0;
        int myPayableAmount = 0;

        for (ExpenseParticipant participant : expenseParticipants) {
            boolean isRequesterRow = requesterUserId != null && requesterUserId.equals(participant.getUserId());
            Settlement settlement = settlementByPayerUserId.get(participant.getUserId());

            String participantStatus = resolveParticipantStatus(isRequesterRow, settlement);
            if (SETTLEMENT_COMPLETED_STATUS.equals(participantStatus)) {
                completedCount++;
            } else {
                pendingCount++;
            }

            if (participant.getUserId().equals(currentUserId)) {
                myPayableAmount = safeIntegerValue(participant.getSplitAmount());
            }

            List<RoomSettlementItemSplitResponse> itemSplits = isItemized
                    ? itemSplitsByUserId.getOrDefault(participant.getUserId(), List.of())
                    : List.of();

            participantResponses.add(new RoomSettlementParticipantStatusResponse(
                    isRequesterRow ? null : (settlement == null ? null : settlement.getId()),
                    participant.getUserId(),
                    participant.getUserName(),
                    participant.getUserTag(),
                    participant.getProfileImageUrl(),
                    safeIntegerValue(participant.getSplitAmount()),
                    participantStatus,
                    participant.getUserId().equals(currentUserId),
                    itemSplits
            ));
        }

        LocalDateTime requestedAt = settlements.stream()
                .map(Settlement::getCreatedAt)
                .filter(java.util.Objects::nonNull)
                .min(LocalDateTime::compareTo)
                .orElse(expense.getCreatedAt());

        String roomNameSnapshot = settlements.stream()
                .map(Settlement::getRoomName)
                .filter(StringUtils::hasText)
                .findFirst()
                .orElse(room.getName());

        return new RoomSettlementDetailResponse(
                expense.getId(),
                roomId,
                expense.getRoomSessionId(),
                roomNameSnapshot,
                expense.getTitle(),
                safeIntegerValue(expense.getTotalAmount()),
                expense.getInputType(),
                isItemized,
                expense.getStatus(),
                expense.getPayerUserId(),
                expense.getPayerUserName(),
                participantResponses.size(),
                pendingCount,
                completedCount,
                myPayableAmount,
                currentUserId.equals(expense.getPayerUserId()),
                requestedAt,
                participantResponses
        );
    }

    /**
     * ROOM-13 참여자 상태를 계산한다.
     * 요청자 본인은 settlement row가 없어도 COMPLETED로 보정한다.
     */
    private String resolveParticipantStatus(boolean isRequesterRow, Settlement settlement) {
        if (isRequesterRow) {
            return SETTLEMENT_COMPLETED_STATUS;
        }

        if (settlement == null || settlement.getStatus() == null) {
            return SETTLEMENT_PENDING_STATUS;
        }

        return settlement.getStatus();
    }

    /**
     * ROOM-13 OCR 모드에서 사용자별 품목 분담 정보를 구성한다.
     */
    private Map<Long, List<RoomSettlementItemSplitResponse>> buildItemSplitsByUserId(Long expenseId) {
        List<ExpenseItemParticipant> itemParticipants =
                expenseItemParticipantRepository.findByExpenseIdWithExpenseItem(expenseId);

        return itemParticipants.stream()
                .collect(Collectors.groupingBy(
                        ExpenseItemParticipant::getUserId,
                        Collectors.mapping(itemParticipant -> new RoomSettlementItemSplitResponse(
                                        itemParticipant.getExpenseItem().getId(),
                                        itemParticipant.getExpenseItem().getName(),
                                        safeIntegerValue(itemParticipant.getQuantity()),
                                        safeIntegerValue(itemParticipant.getSplitAmount())
                                ),
                                Collectors.toList())
                ));
    }
    /**
     * ROOM-12 회차 선택 규칙: 활성 세션 우선, 없으면 최신 세션 fallback.
     */
    private RoomSession resolveTargetRoomSession(Long roomId) {
        return roomSessionRepository.findByRoom_IdAndEndedAtIsNull(roomId)
                .or(() -> roomSessionRepository.findTopByRoom_IdOrderByStartedAtDesc(roomId))
                .orElse(null);
    }
    private RoomListResponse buildRoomListResponse(
            Room room,
            Map<Long, List<Long>> participantsByRoomId,
            Map<Long, RoomExpenseSummaryProjection> expenseSummaryByRoomId,
            Map<Long, RoomSettlementSummaryProjection> settlementSummaryByRoomId) {
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

    private int safeIntegerValue(Integer value) {
        return value == null ? 0 : value;
    }

    private long safeLongValue(Long value) {
        return value == null ? 0L : value;
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
     * @param roomId 모임방 ID
     * @param currentUserId 현재 인증된 사용자 ID
     * @param request 카테고리와 세부 내용이 담긴 요청 DTO
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
                        ErrorCode.ROOM_MEMBER_ONLY));

        // 이미 진행 중인 모임은 다시 시작할 수 없다.
        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_ALREADY_IN_PROGRESS);
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

        //룸 참여자 목록 구하기
        List<Long> recipientUserIds = roomParticipantRepository.findUserIdsByRoomId(room.getId());
        //RoomLifecycleNotificationEvent 만들기
        RoomLifecycleNotificationEvent event = RoomLifecycleNotificationEvent.builder()
                .eventType("ROOM_STARTED")
                .roomId(room.getId())
                .roomName(room.getName())
                .triggeredBy(currentUserId)
                .recipientUserIds(recipientUserIds)
                .occurredAt(LocalDateTime.now())
                .build();
        //outboxEventCommandService 호출
        outboxEventCommandService.save(
                "ROOM",
                room.getId(),
                "ROOM_STARTED",
                KafkaTopicNames.ROOM_LIFECYCLE_NOTIFICATION_EVENT,
                event
        );
    }

    /*
     * [ROOM-18] 모임을 종료한다.
     * @param roomId 모임방 ID
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
                        ErrorCode.ROOM_MEMBER_ONLY));

        // 이미 종료된(대기 중인) 모임은 다시 종료할 수 없다.
        if (!room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_NOT_IN_PROGRESS);
        }

        // 정산 요청 중(REQUESTED)인 결제가 남아 있으면 종료할 수 없다.
        // 모든 정산이 완료(SETTLED)되거나 아직 요청되지 않은(PENDING) 상태여야 한다.
        validateNoRequestedExpenses(roomId);

        // 활성 세션(endedAt이 null인 세션)을 찾아 종료 처리한다.
        // finalCategory에 현재 방의 카테고리를 스냅샷으로 저장한다.
        RoomSession activeSession = roomSessionRepository.findByRoom_IdAndEndedAtIsNull(roomId)
                .orElse(null);

        if (activeSession != null) {
            activeSession.endSession(room.getCategory());
        }

        // isProgress 플래그를 false로 전환하여 대기 상태로 복귀한다.
        room.markReady();

        //룸 참여자 목록 구하기
        List<Long> recipientUserIds = roomParticipantRepository.findUserIdsByRoomId(room.getId());
        //RoomLifecycleNotificationEvent 만들기
        RoomLifecycleNotificationEvent event = RoomLifecycleNotificationEvent.builder()
                .eventType("ROOM_ENDED")
                .roomId(room.getId())
                .roomName(room.getName())
                .triggeredBy(currentUserId)
                .recipientUserIds(recipientUserIds)
                .occurredAt(LocalDateTime.now())
                .build();
        //outboxEventCommandService 호출
        outboxEventCommandService.save(
                "ROOM",
                room.getId(),
                "ROOM_ENDED",
                KafkaTopicNames.ROOM_LIFECYCLE_NOTIFICATION_EVENT,
                event
        );
    }

    /*
     * 해당 모임방에 정산 요청 중(REQUESTED) 상태인 결제가 존재하는지 검증한다.
     * 존재하면 409 Conflict 예외를 던져 모임 시작/종료를 차단한다.
     * 
     */
    private void validateNoRequestedExpenses(Long roomId) {
        long requestedCount = expenseRepository.countByRoomIdAndStatus(roomId, "REQUESTED");
        if (requestedCount > 0) {
            throw new CustomException(ErrorCode.ROOM_HAS_REQUESTED_EXPENSE);
        }
    }

    /*
     * [ROOM-15] 방장 권한을 다른 멤버에게 위임한다.
     */
    @Override
    @Transactional
    public void delegateAdmin(Long roomId, Long currentUserId, DelegateAdminRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Long targetUserId = request.getUserId();

        // 본인에게 위임할 수 없다.
        if (currentUserId.equals(targetUserId)) {
            throw new CustomException(ErrorCode.ROOM_CANNOT_DELEGATE_SELF);
        }

        // 방 존재 여부 확인 (논리 삭제 포함)
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        // 요청자가 해당 방의 방장인지 확인한다.
        RoomParticipant currentParticipant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_ONLY));
        if (!currentParticipant.isAdmin()) {
            throw new CustomException("방장만 방장 위임을 할 수 있습니다.", ErrorCode.ROOM_NOT_ADMIN);
        }

        // 위임 대상이 해당 방의 참여자인지 확인한다.
        RoomParticipant targetParticipant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, targetUserId)
                .orElseThrow(() -> new CustomException(
                        "위임 대상 사용자가 해당 모임의 멤버가 아닙니다.",
                        ErrorCode.ROOM_PARTICIPANT_NOT_FOUND));

        // 방장 권한을 교환한다: 기존 방장 → 일반 멤버, 대상 멤버 → 방장
        currentParticipant.changeAdminRole(false);
        targetParticipant.changeAdminRole(true);
    }

    /*
     * [ROOM-16] 모임 참여 인원을 조회한다.
     */
    @Override
    public List<RoomParticipantListResponse> getParticipantList(Long roomId, Long currentUserId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        // 방 존재 여부 확인 (논리 삭제 포함)
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (room.getDeletedAt() != null) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        // 요청자가 해당 방의 멤버인지 확인
        roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(
                        "해당 모임의 멤버만 참여자 목록을 조회할 수 있습니다.",
                        ErrorCode.ROOM_MEMBER_ONLY));

        // 해당 방의 모든 참여자 엔티티 조회
        List<RoomParticipant> participants = roomParticipantRepository.findByRoom_Id(roomId);

        if (participants.isEmpty()) {
            return List.of();
        }

        // Core Service에서 프로필 정보 일괄 조회
        List<Long> userIds = participants.stream()
                .map(RoomParticipant::getUserId)
                .toList();

        UserProfileBatchRequest profileRequest = UserProfileBatchRequest.builder()
                .userIds(userIds)
                .build();

        // Core Service 호출 및 응답 처리
        final Map<Long, UserProfileSnapshotResponse> profileMap = new java.util.HashMap<>();
        try {
            var response = coreClient.getUserProfiles(profileRequest);
            if (response != null && response.isSuccess() && response.getData() != null) {
                response.getData().forEach(profile -> 
                    profileMap.put(profile.getUserId(), profile)
                );
            }
        } catch (Exception e) {
            // 외부 API 통신 실패 시 로그를 남기고, 프로필 정보 없이 진행 (혹은 기획에 따라 예외를 던짐)
            // 현재 구조에서는 이름이 "Unknown", 프로필은 null로 내려가게 함으로써 장애 격리(Fault Tolerance) 처리를 적용함.
            org.slf4j.LoggerFactory.getLogger(RoomServiceImpl.class)
                    .error("Failed to fetch user profiles from core-service for room: {}", roomId, e);
        }

        // 참여자 엔티티와 프로필 정보를 매핑하여 응답 DTO 리스트 생성
        return participants.stream()
                .map(participant -> {
                    UserProfileSnapshotResponse profile = profileMap.get(participant.getUserId());
                    return RoomParticipantListResponse.builder()
                            .userId(participant.getUserId())
                            .profileUrl(profile != null ? profile.getProfileImageUrl() : null)
                            .name(profile != null
                                    ? profile.getUserName() + "#" + profile.getUserTag()
                                    : "Unknown")
                            .role(participant.isAdmin() ? "ADMIN" : "MEMBER")
                            .build();
                })
                .toList();
    }
}













