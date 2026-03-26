package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.badge.service.BadgeTriggerService;
import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.external.UserProfileBatchRequest;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.entity.ExpenseItem;
import com.duckchi.pay.domain.expense.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.mapper.ExpenseMapper;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.expense.validator.ExpenseValidator;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
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
import org.springframework.util.StopWatch;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FinanceClient financeClient;
    private final ExpenseRepository expenseRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final CoreClient coreClient;
    private final BadgeTriggerService badgeTriggerService;

    private final ExpenseValidator expenseValidator;
    private final ExpenseMapper expenseMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${finance.api.key}")
    private String apiKey;

    @Override
    @Transactional(readOnly = true)
    public List<AccountHistoryResponse> getAccountHistory(Long userId) {
        log.info("[DEBUG] getAccountHistory started for userId: {}", userId);
        StopWatch stopWatch = new StopWatch("Account History Pipeline");
        
        log.info("[DEBUG] Fetching from Finance API directly");
        stopWatch.start("Preparation");
        UserFinanceProfileResponse financeProfile = getUserFinanceProfile(userId);
        
        FinanceRequestHeader header = FinanceRequestHeader.createHeader(
                "inquireTransactionHistoryList", "inquireTransactionHistoryList",
                apiKey, financeProfile.getSsafyUserKey()
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
        stopWatch.stop();

        try {
            log.info("[DEBUG] Calling External Finance API...");
            stopWatch.start("External API Call");
            TransactionHistoryResponse response = financeClient.fetchTransactionHistory(externalRequest);
            stopWatch.stop();

            if (response == null || response.getRec() == null || response.getRec().getList() == null) {
                log.info("[DEBUG] Finance API returned empty list.");
                return List.of();
            }

            log.info("[DEBUG] Mapping results... Count: {}", response.getRec().getList().size());
            stopWatch.start("Data Mapping");
            List<AccountHistoryResponse> result = response.getRec().getList().stream()
                    .map(detail -> AccountHistoryResponse.builder()
                            .transactionMemo(detail.getTransactionSummary())
                            .amount(Integer.parseInt(detail.getTransactionBalance()))
                            .transactionAt(parseLocalDateTime(detail.getTransactionDate(), detail.getTransactionTime()))
                            .build())
                    .toList();
            stopWatch.stop();

            log.info("[DEBUG] Successfully fetched {} records. Total time: {}ms", result.size(), stopWatch.getTotalTimeMillis());
            return result;
        } catch (Exception e) {
            log.error("[CRITICAL] getAccountHistory Failed!", e);
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }
    }

    // ... (나머지 메서드 생략)
    @Override
    @Transactional(readOnly = true)
    public List<ExpenseParticipantOptionResponse> getExpenseParticipants(Long userId, Long roomId) {
        expenseValidator.validateRoomMember(roomId, userId);

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
    public Long registerExpense(Long userId, Long roomId, ExpenseUpsertRequest request) {
        expenseValidator.validateRegistration(userId, roomId, request);
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
        Long expenseId = expenseRepository.save(expense).getId();

        // [BADGE 트리거] OCR 영수증 스캔 등록 시 뱃지 진행도 갱신 (SCANNER_DUCK +1)
        if ("OCR".equals(request.getInputType())) {
            badgeTriggerService.callBadgeCheckSafely(
                    expenseId,
                    com.duckchi.pay.domain.badge.dto.BadgeCheckRequest.builder()
                            .userId(userId)
                            .eventType("EXPENSE_OCR_ADDED")
                            .build(),
                    "EXPENSE_OCR_ADDED"
            );
        }

        return expenseId;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByRoom(Long userId, Long roomId) {
        expenseValidator.validateRoomMember(roomId, userId);
        return expenseRepository.findAllByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(expenseMapper::toExpenseResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getMyExpensesByRoom(Long userId, Long roomId) {
        expenseValidator.validateRoomMember(roomId, userId);
        return expenseRepository.findAllByRoomIdAndPayerUserIdOrderByCreatedAtDesc(roomId, userId).stream()
                .map(expenseMapper::toExpenseResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseDetailResponse getExpenseDetail(Long userId, Long roomId, Long expenseId) {
        expenseValidator.validateRoomMember(roomId, userId);
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        return expenseMapper.toDetailResponse(expense);
    }

    @Override
    @Transactional
    public void deleteExpense(Long userId, Long roomId, Long expenseId) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        expenseValidator.validateEditableByRequester(userId, expense);
        expenseRepository.delete(expense);
    }

    @Override
    @Transactional
    public void updateExpense(Long userId, Long roomId, Long expenseId, ExpenseUpsertRequest request) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        expenseValidator.validateEditableByRequester(userId, expense);
        expenseValidator.validateRegistration(userId, roomId, request);
        Map<Long, UserProfileSnapshotResponse> profileMap = getUserProfiles(collectReferencedUserIds(userId, request));

        expense.updateBasicInfo(request.getTitle(), request.getTotalAmount(), request.getPaidAt(), request.getReceiptImageUrl());
        expense.getParticipants().clear();
        expense.getItems().clear();
        entityManager.flush();

        addParticipantsAndItems(request, expense, profileMap);
    }

    private void addParticipantsAndItems(ExpenseUpsertRequest request, Expense expense, Map<Long, UserProfileSnapshotResponse> profileMap) {
        request.getParticipants().forEach(participant -> {
            UserProfileSnapshotResponse profile = resolveRequiredProfile(profileMap, participant.getUserId());
            expense.getParticipants().add(ExpenseParticipant.builder()
                    .expense(expense)
                    .userId(participant.getUserId())
                    .userName(profile.getUserName())
                    .userTag(profile.getUserTag())
                    .profileImageUrl(profile.getProfileImageUrl())
                    .splitAmount(participant.getSplitAmount())
                    .build());
        });

        if (request.getItems() != null) {
            request.getItems().forEach(itemRequest -> {
                ExpenseItem item = ExpenseItem.builder()
                        .expense(expense)
                        .name(itemRequest.getName())
                        .totalAmount(itemRequest.getTotalAmount())
                        .quantity(itemRequest.getQuantity())
                        .build();

                itemRequest.getSplits().forEach(split -> {
                    UserProfileSnapshotResponse profile = resolveRequiredProfile(profileMap, split.getUserId());
                    item.getItemParticipants().add(ExpenseItemParticipant.builder()
                            .expenseItem(item)
                            .userId(split.getUserId())
                            .userName(profile.getUserName())
                            .userTag(profile.getUserTag())
                            .profileImageUrl(profile.getProfileImageUrl())
                            .splitAmount(split.getSplitAmount())
                            .quantity(split.getQuantity())
                            .build());
                });
                expense.getItems().add(item);
            });
        }
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
        ApiResponseDto<UserFinanceProfileResponse> response = coreClient.getUserFinanceProfile(userId);
        if (response == null || !response.isSuccess() || response.getData() == null) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        return response.getData();
    }

    private Map<Long, UserProfileSnapshotResponse> getUserProfiles(List<Long> userIds) {
        List<Long> distinctUserIds = userIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinctUserIds.isEmpty()) return Map.of();

        ApiResponseDto<List<UserProfileSnapshotResponse>> response = coreClient.getUserProfiles(
                UserProfileBatchRequest.builder().userIds(distinctUserIds).build());

        if (response == null || !response.isSuccess() || response.getData() == null) {
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }

        Map<Long, UserProfileSnapshotResponse> profileMap = new LinkedHashMap<>();
        response.getData().forEach(profile -> profileMap.put(profile.getUserId(), profile));
        return profileMap;
    }

    private List<Long> collectReferencedUserIds(Long payerUserId, ExpenseUpsertRequest request) {
        Set<Long> userIds = new LinkedHashSet<>();
        userIds.add(payerUserId);
        request.getParticipants().forEach(p -> userIds.add(p.getUserId()));
        if (request.getItems() != null) {
            request.getItems().forEach(i -> i.getSplits().forEach(s -> userIds.add(s.getUserId())));
        }
        return List.copyOf(userIds);
    }

    private UserProfileSnapshotResponse resolveRequiredProfile(Map<Long, UserProfileSnapshotResponse> profileMap, Long userId) {
        return Objects.requireNonNull(profileMap.get(userId), "User profile must exist");
    }

    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
