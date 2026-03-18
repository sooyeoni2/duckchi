package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
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
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 결제안 등록, 조회, 수정, 삭제와 계좌 거래 내역 조회를 처리하는 서비스 구현체이다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
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

    /**
     * 로그인 사용자의 금융 프로필을 기준으로 최근 계좌 거래 내역을 조회한다.
     */
    @Override
    @Transactional(readOnly = true)
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
                            .counterAccountNo(detail.getTransactionAccountNo())
                            .build())
                    .toList();
        } catch (Exception e) {
            log.error("Failed to map finance history response.", e);
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    /**
     * 결제안을 저장하고 참여자 및 품목 정보를 함께 구성한다.
     */
    @Override
    @Transactional
    public Long registerExpense(Long userId, ExpenseRegistrationRequest request) {
        validateRegistration(request);

        Expense expense = Expense.builder()
                .roomId(request.getRoomId())
                .roomSessionId(request.getRoomSessionId())
                .payerUserId(userId)
                .payerUserName(extractPayerName(userId, request.getParticipants()))
                .inputType(request.getInputType())
                .title(request.getTitle())
                .totalAmount(request.getTotalAmount())
                .paidAt(request.getPaidAt())
                .receiptImageUrl(request.getReceiptImageUrl())
                .build();

        addParticipantsAndItems(request, expense);
        return expenseRepository.save(expense).getId();
    }

    /**
     * 모임방 전체 결제안 목록을 조회한다.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByRoom(Long roomId) {
        return expenseRepository.findAllByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(this::toExpenseResponse)
                .toList();
    }

    /**
     * 모임방 내에서 로그인 사용자가 생성한 결제안만 조회한다.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getMyExpensesByRoom(Long userId, Long roomId) {
        return expenseRepository.findAllByRoomIdAndPayerUserIdOrderByCreatedAtDesc(roomId, userId).stream()
                .map(this::toExpenseResponse)
                .toList();
    }

    /**
     * 결제안 상세 정보를 참여자 및 품목 단위로 조합해 반환한다.
     */
    @Override
    @Transactional(readOnly = true)
    public ExpenseDetailResponse getExpenseDetail(Long roomId, Long expenseId) {
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

    /**
     * 결제안을 삭제한다.
     */
    @Override
    @Transactional
    public void deleteExpense(Long userId, Long roomId, Long expenseId) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        validateEditableByRequester(userId, expense);
        expenseRepository.delete(expense);
    }

    /**
     * 결제안을 수정하고 참여자 및 품목 구성을 새 요청 기준으로 다시 생성한다.
     */
    @Override
    @Transactional
    public void updateExpense(Long userId, Long roomId, Long expenseId, ExpenseRegistrationRequest request) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        validateEditableByRequester(userId, expense);
        validateRegistration(request);

        expense.updateBasicInfo(
                request.getTitle(),
                request.getTotalAmount(),
                request.getPaidAt(),
                request.getReceiptImageUrl()
        );

        expense.getParticipants().clear();
        expense.getItems().clear();
        entityManager.flush();

        addParticipantsAndItems(request, expense);
    }

    /**
     * 수정 및 삭제 가능 여부를 검사한다.
     */
    private void validateEditableByRequester(Long userId, Expense expense) {
        if (!expense.getPayerUserId().equals(userId)) {
            throw new CustomException(ErrorCode.COMMON_FORBIDDEN);
        }

        if (!"PENDING".equals(expense.getStatus())) {
            throw new CustomException(ErrorCode.EXPENSE_CANNOT_MODIFY);
        }
    }

    /**
     * 결제안 등록/수정 요청의 방, 참여자, 금액 정합성을 검증한다.
     */
    private void validateRegistration(ExpenseRegistrationRequest request) {
        RoomSession session = roomSessionRepository.findById(request.getRoomSessionId())
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (!session.getRoomId().equals(request.getRoomId())) {
            throw new CustomException(ErrorCode.ROOM_SESSION_MISMATCH);
        }

        int totalSplit = request.getParticipants().stream()
                .mapToInt(ExpenseRegistrationRequest.ParticipantRequest::getSplitAmount)
                .sum();
        if (totalSplit != request.getTotalAmount()) {
            throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
        }

        List<Long> memberIds = roomParticipantRepository.findUserIdsByRoomId(request.getRoomId());
        Set<Long> memberSet = new HashSet<>(memberIds);
        request.getParticipants().forEach(participant -> {
            if (!memberSet.contains(participant.getUserId())) {
                throw new CustomException(ErrorCode.ROOM_PARTICIPANT_NOT_FOUND);
            }
        });

        if (request.getItems() != null) {
            request.getItems().forEach(item -> {
                int itemSum = item.getSplits().stream()
                        .mapToInt(split -> split.getSplitAmount())
                        .sum();
                if (itemSum != item.getTotalAmount()) {
                    throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
                }
            });
        }
    }

    /**
     * 참여자 및 품목 정보를 결제 엔티티에 연결한다.
     */
    private void addParticipantsAndItems(ExpenseRegistrationRequest request, Expense expense) {
        request.getParticipants().forEach(participant -> expense.getParticipants().add(
                ExpenseParticipant.builder()
                        .expense(expense)
                        .userId(participant.getUserId())
                        .userName(participant.getUserName())
                        .userTag(participant.getUserTag())
                        .profileImageUrl(participant.getProfileImageUrl())
                        .splitAmount(participant.getSplitAmount())
                        .build()
        ));

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            mapItems(request, expense);
        }
    }

    /**
     * 품목별 분담 정보를 엔티티 구조로 변환한다.
     */
    private void mapItems(ExpenseRegistrationRequest request, Expense expense) {
        request.getItems().forEach(itemRequest -> {
            ExpenseItem item = ExpenseItem.builder()
                    .expense(expense)
                    .name(itemRequest.getName())
                    .totalAmount(itemRequest.getTotalAmount())
                    .quantity(itemRequest.getQuantity())
                    .build();

            itemRequest.getSplits().forEach(split -> item.getItemParticipants().add(
                    ExpenseItemParticipant.builder()
                            .expenseItem(item)
                            .userId(split.getUserId())
                            .userName(resolveParticipantName(request.getParticipants(), split.getUserId()))
                            .userTag("#000")
                            .splitAmount(split.getSplitAmount())
                            .quantity(split.getQuantity())
                            .build()
            ));

            expense.getItems().add(item);
        });
    }

    /**
     * 방 ID와 결제안 ID의 관계를 검증하며 결제안을 조회한다.
     */
    private Expense findExpenseWithRoomCheck(Long roomId, Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (!expense.getRoomId().equals(roomId)) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }
        return expense;
    }

    /**
     * core-service 내부 API를 호출해 사용자 금융 프로필을 조회한다.
     */
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
     * 목록 조회용 응답 DTO로 변환한다.
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

    /**
     * 참여자 목록에서 결제자 이름을 추출한다.
     */
    private String extractPayerName(Long userId, List<ExpenseRegistrationRequest.ParticipantRequest> participants) {
        return participants.stream()
                .filter(participant -> participant.getUserId().equals(userId))
                .map(ExpenseRegistrationRequest.ParticipantRequest::getUserName)
                .findFirst()
                .orElse("알 수 없는 결제자");
    }

    /**
     * 참여자 목록에서 특정 사용자 이름을 찾는다.
     */
    private String resolveParticipantName(
            List<ExpenseRegistrationRequest.ParticipantRequest> participants,
            Long userId
    ) {
        return participants.stream()
                .filter(participant -> participant.getUserId().equals(userId))
                .map(ExpenseRegistrationRequest.ParticipantRequest::getUserName)
                .findFirst()
                .orElse("알 수 없는 참여자");
    }

    /**
     * 금융망 응답의 날짜/시간 문자열을 LocalDateTime으로 변환한다.
     */
    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
