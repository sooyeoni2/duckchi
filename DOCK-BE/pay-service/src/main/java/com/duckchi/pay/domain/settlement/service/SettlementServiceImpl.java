package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.settlement.dto.event.ExpenseSettledNotificationEvent;
import com.duckchi.pay.domain.settlement.dto.event.SettlementRequestNotificationEvent;
import com.duckchi.pay.domain.settlement.dto.request.SettlementManualTransferRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.dto.request.SettlementTransferRequest;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementItemResponse;
import com.duckchi.pay.domain.settlement.dto.response.PendingSettlementsResponse;
import com.duckchi.pay.domain.settlement.dto.response.SettlementManualTransferResponse;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.duckchi.pay.infra.kafka.service.OutboxEventCommandService;
import com.duckchi.pay.infra.kafka.type.KafkaTopicNames;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementServiceImpl implements SettlementService {

    private static final String EXPENSE_STATUS_PENDING = "PENDING";
    private static final String SETTLEMENT_PENDING_STATUS = "PENDING";
    private static final String MANUAL_TRANSACTION_PREFIX = "MANUAL-";
    private static final int TRANSFER_BATCH_MAX_SIZE = 30;
    private static final String UK_SETTLEMENTS_EXPENSE_PAYER = "UK_SETTLEMENTS_EXPENSE_PAYER";
    private static final String UK_SETTLEMENTS_BANK_TRANSACTION_ID = "UK_SETTLEMENTS_BANK_TRANSACTION_ID";

    private final ExpenseRepository expenseRepository;
    private final ExpenseParticipantRepository expenseParticipantRepository;
    private final SettlementRepository settlementRepository;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final SettlementTransferExecutor settlementTransferExecutor;
    private final OutboxEventCommandService outboxEventCommandService;

    @Override
    @Transactional
    public void requestSettlements(Long currentUserId, SettlementRequestCreateRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        // 1) 입력 정규화/검증: 중복 ID와 잘못된 ID를 조기 차단해 하위 로직 복잡도를 줄인다.
        List<Long> expenseIds = validateAndNormalizeIds(request.requestedExpenseIds());
        // 2) 동시 요청 경쟁 제어: 같은 expense에 대한 중복 요청 레이스를 줄이기 위해 비관적 락으로 조회한다.
        List<Expense> expenses = expenseRepository.findAllByIdInForUpdate(expenseIds);

        // 3) 도메인 권한/상태 검증: 존재성 -> 요청자 일치 -> 멤버십 -> 상태 순으로 빠르게 실패시킨다.
        validateAllExpensesExist(expenseIds, expenses);
        validateRequester(currentUserId, expenses);
        validateRoomMembership(currentUserId, expenses);
        validateExpenseStatus(expenses);

        // 4) 참여자 행 락 조회: 정산 생성 직전의 분담금 스냅샷을 고정한다.
        List<ExpenseParticipant> participants = expenseParticipantRepository.findByExpense_IdInForUpdate(expenseIds);
        Map<Long, List<ExpenseParticipant>> participantsByExpenseId = participants.stream()
                .collect(Collectors.groupingBy(participant -> participant.getExpense().getId()));
        validateParticipantAmountIntegrity(expenses, participantsByExpenseId);

        // 5) 사전 중복 방어: 이미 생성된 settlement가 있으면 비즈니스 충돌로 간주한다.
        if (settlementRepository.existsByExpenseIdIn(expenseIds)) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_REQUESTED);
        }

        Map<Long, String> roomNames = loadRoomNames(expenses);
        List<Settlement> settlements = buildSettlements(expenses, participantsByExpenseId, roomNames);

        if (settlements.isEmpty()) {
            throw new CustomException(ErrorCode.SETTLEMENT_REQUEST_TARGET_EMPTY);
        }

        try {
            settlementRepository.saveAll(settlements);
            // flush 시점에 DB UNIQUE 위반을 즉시 감지해 서비스 레벨에서 409로 매핑한다.
            settlementRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            if (isSettlementUniqueViolation(ex)) {
                throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_REQUESTED);
            }
            throw ex;
        }

        // settlement 생성이 확정된 뒤에만 expense 상태를 REQUESTED로 전이한다.
        expenses.forEach(Expense::markRequested);

        publishSettlementRequestNotificationEvents(settlements, expenses);


    }

    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void transferSettlements(Long currentUserId, SettlementTransferRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        List<Long> settlementIds = validateAndNormalizeIds(request.settlementIds());
        validateTransferBatchSize(settlementIds);

        // 송금 실행 전 선검증으로 입력 오류/권한 오류를 조기 차단해 외부 금융망 오호출을 줄인다.
        List<Settlement> settlements = settlementRepository.findAllByIdIn(settlementIds);
        validateAllSettlementsExist(settlementIds, settlements);
        validateSettlementPayerAuthorization(currentUserId, settlements);
        validateSettlementPendingStatus(settlements);

        List<Long> sortedSettlementIds = settlementIds.stream().sorted().toList();
        List<Long> failedSettlementIds = new ArrayList<>();

        for (Long settlementId : sortedSettlementIds) {
            try {
                settlementTransferExecutor.transferOne(currentUserId, settlementId);
            } catch (CustomException ex) {
                // 다건 송금은 외부망/DB 완전 원자성이 불가능하므로 건별 실패를 수집해 최종 partial 오류로 응답한다.
                failedSettlementIds.add(settlementId);
                log.warn("정산 송금 실패. settlementId={}, errorCode={}", settlementId, ex.getErrorCode().getCode());
            }
        }

        if (!failedSettlementIds.isEmpty()) {
            throw new CustomException(ErrorCode.SETTLEMENT_TRANSFER_PARTIAL, failedSettlementIds);
        }
    }
    @Override
    @Transactional
    public SettlementManualTransferResponse manualTransferSettlement(
            Long currentUserId,
            SettlementManualTransferRequest request
    ) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        if (request == null || request.settlementId() == null || request.settlementId() <= 0L) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        Settlement settlement = settlementRepository.findByIdForUpdate(request.settlementId())
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_NOT_FOUND));

        // 수기 완료는 총무(정산 요청자)만 확정할 수 있다.
        if (!currentUserId.equals(settlement.getRequesterUserId())) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER);
        }

        // 동일 정산의 중복 완료 처리를 차단해 상태 정합성을 보장한다.
        if (!SETTLEMENT_PENDING_STATUS.equals(settlement.getStatus())) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_COMPLETED);
        }

        LocalDateTime completedAt = LocalDateTime.now();
        settlement.markCompleted(MANUAL_TRANSACTION_PREFIX + settlement.getId(), completedAt);

        Expense expense = expenseRepository.findByIdForUpdate(settlement.getExpenseId())
                .orElseThrow(() -> new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND));

        // 동일 결제의 미완료 정산이 0건이 되는 시점에만 결제 상태를 SETTLED로 전이한다.
        if (!settlementRepository.existsByExpenseIdAndStatus(expense.getId(), SETTLEMENT_PENDING_STATUS)) {
            expense.markSettled();

            //Event 만들기
            ExpenseSettledNotificationEvent event = ExpenseSettledNotificationEvent.builder()
                    .expenseId(expense.getId())
                    .expenseTitle(expense.getTitle())
                    .payerUserId(expense.getPayerUserId())
                    .occurredAt(LocalDateTime.now())
                    .build();
            //outboxEventCommandService 호출
            outboxEventCommandService.save(
                    "EXPENSE",
                    expense.getId(),
                    "EXPENSE_SETTLED",
                    KafkaTopicNames.EXPENSE_SETTLED_NOTIFICATION_EVENT,
                    event
            );
        }

        return new SettlementManualTransferResponse(
                settlement.getId(),
                settlement.getExpenseId(),
                settlement.getStatus(),
                expense.getStatus(),
                completedAt
        );
    }
    @Override
    public PendingSettlementsResponse getPendingSettlements(Long currentUserId, Long expenseId) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        if (expenseId == null || expenseId <= 0L) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        List<Settlement> settlements = settlementRepository.findByExpenseIdOrderByCreatedAtAscIdAsc(expenseId);
        if (settlements.isEmpty()) {
            throw new CustomException(ErrorCode.SETTLEMENT_NOT_FOUND);
        }

        Settlement firstSettlement = settlements.get(0);

        // 총무 확인 화면은 정산 요청자 본인만 조회할 수 있도록 제한한다.
        if (!currentUserId.equals(firstSettlement.getRequesterUserId())) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER);
        }

        int totalPayableAmount = settlements.stream()
                .mapToInt(Settlement::getPayableAmount)
                .sum();

        int pendingCount = (int) settlements.stream()
                .filter(settlement -> SETTLEMENT_PENDING_STATUS.equals(settlement.getStatus()))
                .count();

        int completedCount = settlements.size() - pendingCount;

        List<PendingSettlementItemResponse> settlementItems = settlements.stream()
                .map(settlement -> new PendingSettlementItemResponse(
                        settlement.getId(),
                        settlement.getPayerUserId(),
                        settlement.getPayerUserName(),
                        settlement.getPayableAmount(),
                        settlement.getStatus(),
                        settlement.getCreatedAt(),
                        settlement.getCompletedAt()
                ))
                .toList();

        return new PendingSettlementsResponse(
                firstSettlement.getExpenseId(),
                firstSettlement.getRoomId(),
                firstSettlement.getRoomName(),
                firstSettlement.getRequesterUserId(),
                firstSettlement.getRequesterUserName(),
                totalPayableAmount,
                pendingCount,
                completedCount,
                settlementItems
        );
    }
    private void validateTransferBatchSize(List<Long> settlementIds) {
        if (settlementIds.size() > TRANSFER_BATCH_MAX_SIZE) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }

    //정산요청 알림 이벤트 publish 메서드
    private void publishSettlementRequestNotificationEvents(List<Settlement> settlements, List<Expense> expenses) {

        //expense를 expenseId로 map으로 변형
        Map<Long, Expense> expenseById = expenses.stream()
                .collect(Collectors.toMap(Expense::getId, expense -> expense));

        //settlements에서 roomId 추출
        Long roomId = settlements.get(0).getRoomId();
        //roomId로 방 참여자 조회
        Map<Long, Boolean> agreementByUserId = roomParticipantRepository.findByRoom_Id(roomId).stream()
                .collect(Collectors.toMap(
                        RoomParticipant::getUserId,
                        RoomParticipant::isAgreed
                ));
        //settlement들을 payerUserId 기준으로 묶기
        Map<Long, List<Settlement>> settlementsByReceiver = settlements.stream()
                .collect(Collectors.groupingBy(
                        Settlement::getPayerUserId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        //사용자별로 묶인 settlement 그룹 처리
        for (Map.Entry<Long, List<Settlement>> entry : settlementsByReceiver.entrySet()) {
            Long receiverId = entry.getKey(); //알림 받을 사용자 id
            List<Settlement> receiverSettlements = entry.getValue(); //사용자가 받아야할 settlement 목록
            Settlement firstSettlement = receiverSettlements.get(0); //공통값 꺼낼때 잡은 것

            boolean isAgreed = agreementByUserId.getOrDefault(receiverId, false); //이 사용자의 isAgreed 상태 꺼내기

            //총 내야할 금액 조립
            int totalAmount = receiverSettlements.stream()
                    .mapToInt(Settlement::getPayableAmount)
                    .sum();

            //정산 요청 id와 결제 항목명 매핑
            Map<Long, String> settlementTitles = receiverSettlements.stream()
                    .collect(Collectors.toMap(
                            Settlement::getId,
                            settlement -> {
                                Expense expense = expenseById.get(settlement.getExpenseId());
                                return expense != null ? expense.getTitle() : "정산 요청";
                            },
                            (left, right) -> left, //key가 중복되면 먼저 값 유지
                            LinkedHashMap::new //순서 유지
                    ));

            //이벤트 조립
            SettlementRequestNotificationEvent event = SettlementRequestNotificationEvent.builder()
                    .receiverId(receiverId)
                    .isAgreed(isAgreed)
                    .roomName(firstSettlement.getRoomName())
                    .totalAmount(totalAmount)
                    .requesterUserName(firstSettlement.getRequesterUserName())
                    .settlements(settlementTitles)
                    .build();

            //대표 정산 id 추출
            Long aggregateId = receiverSettlements.stream()
                    .map(Settlement::getId)
                    .min(Long::compareTo)
                    .orElseThrow();
            //outboxEventCommandService 호출
            outboxEventCommandService.save(
                    "SETTLEMENT",
                    aggregateId,
                    "SETTLEMENT_REQUESTED",
                    KafkaTopicNames.SETTLEMENT_REQUEST_NOTIFICATION_EVENT,
                    event
            );
        }
    }

    private void validateAllSettlementsExist(List<Long> requestedIds, List<Settlement> settlements) {
        if (settlements.size() != requestedIds.size()) {
            throw new CustomException(ErrorCode.SETTLEMENT_NOT_FOUND);
        }
    }

    private void validateSettlementPayerAuthorization(Long currentUserId, List<Settlement> settlements) {
        boolean hasForbiddenSettlement = settlements.stream()
                .anyMatch(settlement -> !currentUserId.equals(settlement.getPayerUserId()));

        if (hasForbiddenSettlement) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_PAYER);
        }
    }

    private void validateSettlementPendingStatus(List<Settlement> settlements) {
        boolean hasCompletedSettlement = settlements.stream()
                .anyMatch(settlement -> !SETTLEMENT_PENDING_STATUS.equals(settlement.getStatus()));

        if (hasCompletedSettlement) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_COMPLETED);
        }
    }

    private List<Long> validateAndNormalizeIds(List<Long> requestedExpenseIds) {
        if (requestedExpenseIds == null || requestedExpenseIds.isEmpty()) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        Set<Long> deduplicatedIds = new LinkedHashSet<>(requestedExpenseIds);
        if (deduplicatedIds.size() != requestedExpenseIds.size()) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        return deduplicatedIds.stream()
                .peek(id -> {
                    if (id == null || id <= 0L) {
                        throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
                    }
                })
                .toList();
    }

    private void validateAllExpensesExist(List<Long> requestedIds, List<Expense> expenses) {
        // 요청 ID 수와 조회 결과 수가 다르면 일부 ID가 존재하지 않는 상태다.
        if (expenses.size() != requestedIds.size()) {
            throw new CustomException(ErrorCode.SETTLEMENT_EXPENSE_NOT_FOUND);
        }
    }

    private void validateRequester(Long currentUserId, List<Expense> expenses) {
        boolean hasInvalidRequester = expenses.stream()
                .anyMatch(expense -> !currentUserId.equals(expense.getPayerUserId()));

        if (hasInvalidRequester) {
            throw new CustomException(ErrorCode.SETTLEMENT_FORBIDDEN_REQUESTER);
        }
    }

    private void validateRoomMembership(Long currentUserId, List<Expense> expenses) {
        // 다건 요청에서 room이 섞일 수 있으므로 roomId 단위로 멤버십을 모두 검증한다.
        Set<Long> roomIds = expenses.stream().map(Expense::getRoomId).collect(Collectors.toSet());

        boolean notMemberExists = roomIds.stream()
                .anyMatch(roomId -> !roomParticipantRepository.existsByRoom_IdAndUserId(roomId, currentUserId));

        if (notMemberExists) {
            throw new CustomException(ErrorCode.COMMON_FORBIDDEN);
        }
    }

    private void validateExpenseStatus(List<Expense> expenses) {
        // SET-01은 PENDING 결제만 요청 가능하다.
        boolean hasNonPending = expenses.stream()
                .anyMatch(expense -> !EXPENSE_STATUS_PENDING.equals(expense.getStatus()));

        if (hasNonPending) {
            throw new CustomException(ErrorCode.SETTLEMENT_ALREADY_REQUESTED);
        }
    }

    private void validateParticipantAmountIntegrity(
            List<Expense> expenses,
            Map<Long, List<ExpenseParticipant>> participantsByExpenseId
    ) {
        // 결제 총액과 참여자 분담 합계가 다르면 회계적으로 잘못된 데이터이므로 정산 요청을 차단한다.
        for (Expense expense : expenses) {
            List<ExpenseParticipant> expenseParticipants = participantsByExpenseId.getOrDefault(expense.getId(), List.of());
            if (expenseParticipants.isEmpty()) {
                throw new CustomException(ErrorCode.SETTLEMENT_PARTICIPANTS_INVALID);
            }

            int splitAmountSum = 0;
            for (ExpenseParticipant participant : expenseParticipants) {
                Integer splitAmount = participant.getSplitAmount();
                // 0원/음수/NULL 분담금은 잘못된 참여자 데이터이므로 즉시 차단한다.
                if (splitAmount == null || splitAmount <= 0) {
                    throw new CustomException(ErrorCode.SETTLEMENT_PARTICIPANTS_INVALID);
                }
                splitAmountSum += splitAmount;
            }

            if (!expense.getTotalAmount().equals(splitAmountSum)) {
                throw new CustomException(ErrorCode.SETTLEMENT_AMOUNT_MISMATCH);
            }
        }
    }

    private Map<Long, String> loadRoomNames(List<Expense> expenses) {
        Set<Long> roomIds = expenses.stream().map(Expense::getRoomId).collect(Collectors.toSet());

        Map<Long, String> roomNameById = roomRepository.findAllById(roomIds).stream()
                .collect(Collectors.toMap(Room::getId, Room::getName));

        boolean hasMissingRoom = roomIds.stream().anyMatch(roomId -> !roomNameById.containsKey(roomId));
        if (hasMissingRoom) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }

        return roomNameById;
    }

    private List<Settlement> buildSettlements(
            List<Expense> expenses,
            Map<Long, List<ExpenseParticipant>> participantsByExpenseId,
            Map<Long, String> roomNames
    ) {
        List<Settlement> settlements = new ArrayList<>();

        for (Expense expense : expenses) {
            List<ExpenseParticipant> expenseParticipants = participantsByExpenseId.getOrDefault(expense.getId(), List.of());
            String roomName = roomNames.get(expense.getRoomId());

            for (ExpenseParticipant participant : expenseParticipants) {
                // 결제자 본인에게 본인 정산을 생성하지 않도록 명시적으로 제외한다.
                if (expense.getPayerUserId().equals(participant.getUserId())) {
                    continue;
                }

                settlements.add(Settlement.createPending(
                        expense.getRoomId(),
                        expense.getRoomSessionId(),
                        expense.getId(),
                        roomName,
                        expense.getPayerUserId(),
                        expense.getPayerUserName(),
                        participant.getUserId(),
                        participant.getUserName(),
                        participant.getSplitAmount()
                ));
            }
        }

        return settlements;
    }

    private boolean isSettlementUniqueViolation(DataIntegrityViolationException ex) {
        // DataIntegrityViolationException은 범용이므로, 제약명 기반으로 UNIQUE 위반만 선별한다.
        String message = Optional.ofNullable(ex.getMostSpecificCause())
                .map(Throwable::getMessage)
                .orElse("");
        return message.contains(UK_SETTLEMENTS_EXPENSE_PAYER)
                || message.contains(UK_SETTLEMENTS_BANK_TRANSACTION_ID);
    }
}

