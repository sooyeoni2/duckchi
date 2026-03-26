package com.duckchi.pay.domain.expense.validator;

import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 결제안 관련 비즈니스 규칙 검증 컴포넌트.
 */
@Component
@RequiredArgsConstructor
public class ExpenseValidator {

    private final RoomSessionRepository roomSessionRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    /**
     * 등록/수정 공통 사전 검증.
     */
    public Long validateRegistration(Long userId, Long roomId, ExpenseUpsertRequest request) {
        RoomSession session = roomSessionRepository.findByRoom_IdAndEndedAtIsNull(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        validateRoomMember(roomId, userId);

        Set<Long> participantUserIds = validateParticipantsIntegrity(roomId, request);

        if (request.getItems() != null) {
            validateItemsIntegrity(roomId, request.getItems(), participantUserIds);
        }
        
        return session.getId();
    }

    /**
     * 수정/삭제 권한 및 상태 검증.
     */
    public void validateEditableByRequester(Long userId, Expense expense) {
        if (!expense.getPayerUserId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMON_FORBIDDEN);
        }

        if (!"PENDING".equals(expense.getStatus())) {
            throw new CustomException(ErrorCode.EXPENSE_CANNOT_MODIFY);
        }
    }

    /**
     * 방 멤버 권한 검증.
     */
    public void validateRoomMember(Long roomId, Long userId) {
        if (!roomParticipantRepository.existsByRoom_IdAndUserId(roomId, userId)) {
            throw new CustomException(ErrorCode.ROOM_MEMBER_ONLY);
        }
    }



    private Set<Long> validateParticipantsIntegrity(Long roomId, ExpenseUpsertRequest request) {
        validateUniqueParticipantIds(request);

        int totalSplit = request.getParticipants().stream()
                .mapToInt(ExpenseUpsertRequest.ParticipantSplitRequest::getSplitAmount)
                .sum();
        if (totalSplit != request.getTotalAmount()) {
            throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
        }

        List<Long> memberIds = roomParticipantRepository.findUserIdsByRoomId(roomId);
        Set<Long> memberSet = new HashSet<>(memberIds);
        Set<Long> participantUserIds = new HashSet<>();

        request.getParticipants().forEach(participant -> {
            if (!memberSet.contains(participant.getUserId())) {
                throw new CustomException(ErrorCode.ROOM_PARTICIPANT_NOT_FOUND);
            }
            participantUserIds.add(participant.getUserId());
        });

        return participantUserIds;
    }

    private void validateItemsIntegrity(Long roomId, List<ExpenseUpsertRequest.ItemUpsertRequest> items, Set<Long> participantUserIds) {
        List<Long> memberIds = roomParticipantRepository.findUserIdsByRoomId(roomId);
        Set<Long> memberSet = new HashSet<>(memberIds);

        items.forEach(item -> {
            validateItemSplitExistence(item);
            validateItemAmount(item);
            validateItemParticipants(item, memberSet, participantUserIds);
        });
    }

    private void validateItemSplitExistence(ExpenseUpsertRequest.ItemUpsertRequest item) {
        if (item.getSplits() == null || item.getSplits().isEmpty()) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }

    private void validateItemAmount(ExpenseUpsertRequest.ItemUpsertRequest item) {
        int itemSum = item.getSplits().stream()
                .mapToInt(ExpenseUpsertRequest.ItemSplitRequest::getSplitAmount)
                .sum();
        if (itemSum != item.getTotalAmount()) {
            throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
        }
    }

    private void validateItemParticipants(ExpenseUpsertRequest.ItemUpsertRequest item, Set<Long> memberSet, Set<Long> participantUserIds) {
        Set<Long> itemSplitUserIds = new HashSet<>();
        item.getSplits().forEach(split -> {
            if (!memberSet.contains(split.getUserId())) {
                throw new CustomException(ErrorCode.ROOM_PARTICIPANT_NOT_FOUND);
            }
            if (!participantUserIds.contains(split.getUserId())) {
                throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
            }
            if (!itemSplitUserIds.add(split.getUserId())) {
                throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
            }
        });
    }

    private void validateUniqueParticipantIds(ExpenseUpsertRequest request) {
        Set<Long> participantUserIds = new HashSet<>();
        request.getParticipants().forEach(participant -> {
            if (!participantUserIds.add(participant.getUserId())) {
                throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
            }
        });
    }
}
