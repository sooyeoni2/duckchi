package com.duckchi.pay.domain.settlement.service;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseParticipantRepository;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.settlement.dto.request.SettlementRequestCreateRequest;
import com.duckchi.pay.domain.settlement.entity.Settlement;
import com.duckchi.pay.domain.settlement.repository.SettlementRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettlementServiceImpl implements SettlementService {

    private static final String EXPENSE_STATUS_PENDING = "PENDING";
    private static final String UK_SETTLEMENTS_EXPENSE_PAYER = "UK_SETTLEMENTS_EXPENSE_PAYER";
    private static final String UK_SETTLEMENTS_BANK_TRANSACTION_ID = "UK_SETTLEMENTS_BANK_TRANSACTION_ID";

    private final ExpenseRepository expenseRepository;
    private final ExpenseParticipantRepository expenseParticipantRepository;
    private final SettlementRepository settlementRepository;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;

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

