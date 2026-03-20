package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.external.UserProfileBatchRequest;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseItem;
import com.duckchi.pay.domain.expense.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.duckchi.pay.infra.client.CoreClient;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.request.FinanceRequestHeader;
import com.duckchi.pay.infra.finance.dto.request.TransactionHistoryRequest;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
/**
 * 결제안 서비스 구현체.
 * 외부 금융 조회, 방 멤버 검증, 결제안 생성/수정/조회 조합 역할.
 */
public class ExpenseServiceImpl implements ExpenseService {

    private final FinanceClient financeClient;
    private final ExpenseRepository expenseRepository;
    private final RoomSessionRepository roomSessionRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final CoreClient coreClient;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${finance.api.key}")
    private String apiKey;

    @Override
    @Transactional(readOnly = true)
    /**
     * 대표 계좌 기준 거래 내역 조회 로직.
     * 코어 서비스 금융 프로필 검증 후 금융망 조회 수행 역할.
     */
    public List<AccountHistoryResponse> getAccountHistory(Long userId, AccountHistoryRequest request) {
        UserFinanceProfileResponse financeProfile = getUserFinanceProfile(userId);

        if (request != null
                && StringUtils.hasText(request.getAccountNo())
                && !financeProfile.getAccountNo().equals(request.getAccountNo())) {
            throw new CustomException(ErrorCode.FINANCE_INVALID_ACCOUNT);
        }

        FinanceRequestHeader header = FinanceRequestHeader.createHeader(
                "inquireTransactionHistoryList",
                "inquireTransactionHistoryList",
                apiKey,
                financeProfile.getSsafyUserKey()
        );

        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String weekAgo = LocalDateTime.now().minusDays(7).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        TransactionHistoryRequest externalRequest = TransactionHistoryRequest.builder()
                .header(header)
                .accountNo(financeProfile.getAccountNo())
                .startDate(weekAgo)
                .endDate(today)
                .transactionType("D")
                .orderByType("DESC")
                .build();

        TransactionHistoryResponse response;
        try {
            response = financeClient.fetchTransactionHistory(externalRequest);
        } catch (Exception e) {
            log.error("Finance API call failed.", e);
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }

        if (response == null || response.getRec() == null || response.getRec().getList() == null) {
            return List.of();
        }

        try {
            return response.getRec().getList().stream()
                    .map(detail -> AccountHistoryResponse.builder()
                            .transactionMemo(detail.getTransactionSummary())
                            .amount(Integer.parseInt(detail.getTransactionBalance()))
                            .transactionAt(parseLocalDateTime(detail.getTransactionDate(), detail.getTransactionTime()))
                            .build())
                    .toList();
        } catch (Exception e) {
            log.error("Failed to map finance history response.", e);
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 결제 참여자 선택 목록 조회 로직.
     * 방 멤버 검증 후 코어 서비스 사용자 스냅샷 매핑 역할.
     */
    public List<ExpenseParticipantOptionResponse> getExpenseParticipants(Long userId, Long roomId) {
        validateRoomMember(roomId, userId);

        List<Long> roomParticipantUserIds = roomParticipantRepository.findUserIdsByRoomId(roomId);
        Map<Long, UserProfileSnapshotResponse> profileMap = getUserProfiles(roomParticipantUserIds);

        return roomParticipantUserIds.stream()
                .map(profileMap::get)
                .filter(Objects::nonNull)
                .map(profile -> ExpenseParticipantOptionResponse.builder()
                        .userId(profile.getUserId())
                        .userName(profile.getUserName())
                        .userTag(profile.getUserTag())
                        .profileImageUrl(profile.getProfileImageUrl())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    /**
     * 결제안 등록 로직.
     * 회차/참여자 정합성 검증 후 참여자 및 품목 하위 엔티티 구성 역할.
     */
    public Long registerExpense(Long userId, Long roomId, ExpenseUpsertRequest request) {
        validateRegistration(userId, roomId, request);
        Map<Long, UserProfileSnapshotResponse> profileMap = getUserProfiles(collectReferencedUserIds(userId, request));

        Expense expense = Expense.builder()
                .roomId(roomId)
                .roomSessionId(request.getRoomSessionId())
                .payerUserId(userId)
                .payerUserName(resolveRequiredProfile(profileMap, userId).getUserName())
                .inputType(request.getInputType())
                .title(request.getTitle())
                .totalAmount(request.getTotalAmount())
                .paidAt(request.getPaidAt())
                .receiptImageUrl(request.getReceiptImageUrl())
                .build();

        addParticipantsAndItems(request, expense, profileMap);
        return expenseRepository.save(expense).getId();
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 모임방 전체 결제안 목록 조회 로직.
     * 방 멤버만 조회 가능하도록 보호 역할.
     */
    public List<ExpenseResponse> getExpensesByRoom(Long userId, Long roomId) {
        validateRoomMember(roomId, userId);
        return expenseRepository.findAllByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(this::toExpenseResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 내가 만든 결제안 목록 조회 로직.
     * 방 멤버 검증 후 결제자 기준 필터링 역할.
     */
    public List<ExpenseResponse> getMyExpensesByRoom(Long userId, Long roomId) {
        validateRoomMember(roomId, userId);
        return expenseRepository.findAllByRoomIdAndPayerUserIdOrderByCreatedAtDesc(roomId, userId).stream()
                .map(this::toExpenseResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 결제안 상세 조회 로직.
     * 방 멤버 검증 후 참여자/품목 분담 상세 조립 역할.
     */
    public ExpenseDetailResponse getExpenseDetail(Long userId, Long roomId, Long expenseId) {
        validateRoomMember(roomId, userId);
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        return ExpenseDetailResponse.builder()
                .expenseId(expense.getId())
                .title(expense.getTitle())
                .totalAmount(expense.getTotalAmount())
                .paidAt(expense.getPaidAt())
                .payerUserName(expense.getPayerUserName())
                .payerUserId(expense.getPayerUserId())
                .inputType(expense.getInputType())
                .participants(expense.getParticipants().stream()
                        .map(participant -> ExpenseDetailResponse.ParticipantDetail.builder()
                                .userId(participant.getUserId())
                                .userName(participant.getUserName())
                                .userTag(participant.getUserTag())
                                .profileImageUrl(participant.getProfileImageUrl())
                                .splitAmount(participant.getSplitAmount())
                                .build())
                        .toList())
                .items(expense.getItems().stream()
                        .map(item -> ExpenseDetailResponse.ItemDetail.builder()
                                .name(item.getName())
                                .totalAmount(item.getTotalAmount())
                                .quantity(item.getQuantity())
                                .itemParticipants(item.getItemParticipants().stream()
                                        .map(itemParticipant -> ExpenseDetailResponse.ItemParticipantDetail.builder()
                                                .userId(itemParticipant.getUserId())
                                                .userName(itemParticipant.getUserName())
                                                .userTag(itemParticipant.getUserTag())
                                                .profileImageUrl(itemParticipant.getProfileImageUrl())
                                                .splitAmount(itemParticipant.getSplitAmount())
                                                .quantity(itemParticipant.getQuantity())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }

    @Override
    @Transactional
    /**
     * 결제안 삭제 로직.
     * 생성자 권한과 수정 가능 상태 확인 역할.
     */
    public void deleteExpense(Long userId, Long roomId, Long expenseId) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        validateEditableByRequester(userId, expense);
        expenseRepository.delete(expense);
    }

    @Override
    @Transactional
    /**
     * 결제안 수정 로직.
     * 기존 하위 분담 제거 후 새 요청 기준 재구성 역할.
     */
    public void updateExpense(Long userId, Long roomId, Long expenseId, ExpenseUpsertRequest request) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        validateEditableByRequester(userId, expense);
        validateRegistration(userId, roomId, request);
        Map<Long, UserProfileSnapshotResponse> profileMap = getUserProfiles(collectReferencedUserIds(userId, request));

        expense.updateBasicInfo(
                request.getTitle(),
                request.getTotalAmount(),
                request.getPaidAt(),
                request.getReceiptImageUrl()
        );

        expense.getParticipants().clear();
        expense.getItems().clear();
        entityManager.flush();

        addParticipantsAndItems(request, expense, profileMap);
    }

    private void validateEditableByRequester(Long userId, Expense expense) {
        if (!expense.getPayerUserId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMON_FORBIDDEN);
        }

        if (!"PENDING".equals(expense.getStatus())) {
            throw new CustomException(ErrorCode.EXPENSE_CANNOT_MODIFY);
        }
    }

    /**
     * 등록/수정 공통 사전 검증 로직.
     * 회차, 방 멤버, 참여자 합계, 품목 정합성 확인 역할.
     */
    private void validateRegistration(Long userId, Long roomId, ExpenseUpsertRequest request) {
        validateRoomAndSession(roomId, request);
        validateRoomMember(roomId, userId);

        Set<Long> participantUserIds = validateParticipantsIntegrity(roomId, request);

        if (request.getItems() != null) {
            validateItemsIntegrity(roomId, request.getItems(), participantUserIds);
        }
    }

    /**
     * 모임방과 회차 일치 여부 검증 로직.
     * 잘못된 회차 식별자 조합 차단 역할.
     */
    private void validateRoomAndSession(Long roomId, ExpenseUpsertRequest request) {
        RoomSession session = roomSessionRepository.findById(request.getRoomSessionId())
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        // Room 객체와 Long을 직접 비교하면 항상 false이므로, ID끼리 비교해야 한다.
        if (!session.getRoom().getId().equals(roomId)) {
            throw new CustomException(ErrorCode.ROOM_SESSION_MISMATCH);
        }
    }

    /**
     * 참여자 분담 정합성 검증 로직.
     * 분담 합계와 방 멤버 포함 여부 확인 역할.
     */
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

    /**
     * 품목별 분담 정합성 검증 로직.
     * 품목 합계와 품목 참여자 유효성 확인 역할.
     */
    private void validateItemsIntegrity(
            Long roomId,
            List<ExpenseUpsertRequest.ItemUpsertRequest> items,
            Set<Long> participantUserIds
    ) {
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

    private void validateItemParticipants(
            ExpenseUpsertRequest.ItemUpsertRequest item,
            Set<Long> memberSet,
            Set<Long> participantUserIds
    ) {
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

    /**
     * 방 멤버 권한 검증 로직.
     * 방 외부 사용자 접근 차단 역할.
     */
    private void validateRoomMember(Long roomId, Long userId) {
        if (!roomParticipantRepository.existsByRoom_IdAndUserId(roomId, userId)) {
            throw new CustomException(ErrorCode.ROOM_MEMBER_ONLY);
        }
    }

    private void validateUniqueParticipantIds(ExpenseUpsertRequest request) {
        Set<Long> participantUserIds = new HashSet<>();
        request.getParticipants().forEach(participant -> {
            if (!participantUserIds.add(participant.getUserId())) {
                throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
            }
        });
    }

    /**
     * 참여자/품목 하위 엔티티 조립 로직.
     * 요청 DTO를 JPA 저장 구조로 변환하는 역할.
     */
    private void addParticipantsAndItems(
            ExpenseUpsertRequest request,
            Expense expense,
            Map<Long, UserProfileSnapshotResponse> profileMap
    ) {
        request.getParticipants().forEach(participant -> {
            UserProfileSnapshotResponse profile = resolveRequiredProfile(profileMap, participant.getUserId());
            expense.getParticipants().add(
                    ExpenseParticipant.builder()
                            .expense(expense)
                            .userId(participant.getUserId())
                            .userName(profile.getUserName())
                            .userTag(profile.getUserTag())
                            .profileImageUrl(profile.getProfileImageUrl())
                            .splitAmount(participant.getSplitAmount())
                            .build()
            );
        });

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            mapItems(request, expense, profileMap);
        }
    }

    private void mapItems(
            ExpenseUpsertRequest request,
            Expense expense,
            Map<Long, UserProfileSnapshotResponse> profileMap
    ) {
        request.getItems().forEach(itemRequest -> {
            ExpenseItem item = ExpenseItem.builder()
                    .expense(expense)
                    .name(itemRequest.getName())
                    .totalAmount(itemRequest.getTotalAmount())
                    .quantity(itemRequest.getQuantity())
                    .build();

            itemRequest.getSplits().forEach(split -> {
                UserProfileSnapshotResponse profile = resolveRequiredProfile(profileMap, split.getUserId());
                item.getItemParticipants().add(
                        ExpenseItemParticipant.builder()
                                .expenseItem(item)
                                .userId(split.getUserId())
                                .userName(profile.getUserName())
                                .userTag(profile.getUserTag())
                                .profileImageUrl(profile.getProfileImageUrl())
                                .splitAmount(split.getSplitAmount())
                                .quantity(split.getQuantity())
                                .build()
                );
            });

            expense.getItems().add(item);
        });
    }

    private Expense findExpenseWithRoomCheck(Long roomId, Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (!expense.getRoomId().equals(roomId)) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }
        return expense;
    }

    private UserFinanceProfileResponse getUserFinanceProfile(Long userId) {
        try {
            ApiResponseDto<UserFinanceProfileResponse> response = coreClient.getUserFinanceProfile(userId);
            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
            }

            UserFinanceProfileResponse financeProfile = response.getData();
            if (!StringUtils.hasText(financeProfile.getSsafyUserKey())
                    || !StringUtils.hasText(financeProfile.getAccountNo())) {
                throw new CustomException(ErrorCode.FINANCE_INVALID_ACCOUNT);
            }
            return financeProfile;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch finance profile from core-service. userId={}", userId, e);
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    /**
     * 코어 서비스 사용자 프로필 배치 조회 로직.
     * 참여자 이름, 태그, 프로필 이미지 보강 역할.
     */
    private Map<Long, UserProfileSnapshotResponse> getUserProfiles(List<Long> userIds) {
        List<Long> distinctUserIds = userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (distinctUserIds.isEmpty()) {
            return Map.of();
        }

        try {
            ApiResponseDto<List<UserProfileSnapshotResponse>> response = coreClient.getUserProfiles(
                    UserProfileBatchRequest.builder()
                            .userIds(distinctUserIds)
                            .build()
            );

            if (response == null || !response.isSuccess() || response.getData() == null) {
                throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
            }

            Map<Long, UserProfileSnapshotResponse> profileMap = new LinkedHashMap<>();
            response.getData().forEach(profile -> profileMap.put(profile.getUserId(), profile));

            if (profileMap.size() != distinctUserIds.size() || !profileMap.keySet().containsAll(distinctUserIds)) {
                throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
            }

            return profileMap;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to fetch user profiles from core-service. userIds={}", distinctUserIds, e);
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }






    private List<Long> collectReferencedUserIds(Long payerUserId, ExpenseUpsertRequest request) {
        Set<Long> referencedUserIds = new LinkedHashSet<>();
        referencedUserIds.add(payerUserId);
        request.getParticipants().forEach(participant -> referencedUserIds.add(participant.getUserId()));

        if (request.getItems() != null) {
            request.getItems().forEach(item -> {
                if (item.getSplits() != null) {
                    item.getSplits().forEach(split -> referencedUserIds.add(split.getUserId()));
                }
            });
        }

        return List.copyOf(referencedUserIds);
    }

    private UserProfileSnapshotResponse resolveRequiredProfile(
            Map<Long, UserProfileSnapshotResponse> profileMap,
            Long userId
    ) {
        UserProfileSnapshotResponse profile = profileMap.get(userId);
        if (profile == null) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        return profile;
    }

    /**
     * 결제안 목록 응답 변환 로직.
     * 화면 표시용 요약 DTO 생성 역할.
     */
    private ExpenseResponse toExpenseResponse(Expense expense) {
        return ExpenseResponse.builder()
                .expenseId(expense.getId())
                .roomSessionId(expense.getRoomSessionId())
                .title(expense.getTitle())
                .totalAmount(expense.getTotalAmount())
                .payerUserName(expense.getPayerUserName())
                .inputType(expense.getInputType())
                .status(expense.getStatus())
                .paidAt(expense.getPaidAt())
                .createdAt(expense.getCreatedAt())
                .build();
    }

    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
