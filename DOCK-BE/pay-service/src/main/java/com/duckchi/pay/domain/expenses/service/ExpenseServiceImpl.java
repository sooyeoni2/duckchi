package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expenses.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expenses.entity.Expense;
import com.duckchi.pay.domain.expenses.entity.ExpenseItem;
import com.duckchi.pay.domain.expenses.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expenses.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.request.FinanceRequestHeader;
import com.duckchi.pay.infra.finance.dto.request.TransactionHistoryRequest;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 결제 관리 서비스 구현체.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FinanceClient financeClient;
    private final ExpenseRepository expenseRepository;
    private final RoomSessionRepository roomSessionRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${finance.api.key}")
    private String apiKey;

    @Override
    @Transactional(readOnly = true)
    public List<AccountHistoryResponse> getAccountHistory(AccountHistoryRequest request, String userKey) {
        FinanceRequestHeader header = FinanceRequestHeader.createHeader("inquireTransactionHistoryList", "inquireTransactionHistoryList", apiKey, userKey);
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String weekAgo = LocalDateTime.now().minusDays(7).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        TransactionHistoryRequest externalRequest = TransactionHistoryRequest.builder()
                .header(header)
                .accountNo(request.getAccountNo())
                .startDate(weekAgo)
                .endDate(today)
                .transactionType("D")
                .orderByType("DESC")
                .build();

        TransactionHistoryResponse response;
        try {
            response = financeClient.fetchTransactionHistory(externalRequest);
        } catch (Exception e) {
            log.error("Finance API Call Failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.FINANCE_API_ERROR);
        }

        if (response == null || response.getRec() == null) {
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
            log.error("Data Mapping Failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
    }

    @Override
    @Transactional
    public Long registerExpense(ExpenseRegistrationRequest request) {
        // [1] 무결성 및 권한 검증함.
        validateRegistration(request);

        // [2] 결제 원장(Expense) 생성함.
        Expense expense = Expense.builder()
                .roomId(request.getRoomId())
                .roomSessionId(request.getRoomSessionId())
                .payerUserId(1L) // TODO: Gateway 연동 시 실제 유저 ID로 변경함.
                .payerUserName("임시 결제자")
                .inputType(request.getInputType())
                .title(request.getTitle())
                .totalAmount(request.getTotalAmount())
                .paidAt(request.getPaidAt())
                .receiptImageUrl(request.getReceiptImageUrl())
                .build();

        addParticipantsAndItems(request, expense);

        Expense savedExpense = expenseRepository.save(expense);
        return savedExpense.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpensesByRoom(Long roomId) {
        List<Expense> expenses = expenseRepository.findAllByRoomIdOrderByCreatedAtDesc(roomId);
        return expenses.stream()
                .map(e -> ExpenseResponse.builder()
                        .expenseId(e.getId())
                        .roomSessionId(e.getRoomSessionId())
                        .title(e.getTitle())
                        .totalAmount(e.getTotalAmount())
                        .payerUserName(e.getPayerUserName())
                        .inputType(e.getInputType())
                        .status(e.getStatus())
                        .paidAt(e.getPaidAt())
                        .createdAt(e.getCreatedAt())
                        .build())
                .toList();
    }

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
                        .map(p -> ExpenseDetailResponse.ParticipantDetail.builder()
                                .userId(p.getUserId())
                                .userName(p.getUserName())
                                .userTag(p.getUserTag())
                                .profileImageUrl(p.getProfileImageUrl())
                                .splitAmount(p.getSplitAmount())
                                .build())
                        .toList())
                .items(expense.getItems().stream()
                        .map(item -> ExpenseDetailResponse.ItemDetail.builder()
                                .name(item.getName())
                                .totalAmount(item.getTotalAmount())
                                .quantity(item.getQuantity())
                                .itemParticipants(item.getItemParticipants().stream()
                                        .map(ip -> ExpenseDetailResponse.ItemParticipantDetail.builder()
                                                .userId(ip.getUserId())
                                                .userName(ip.getUserName())
                                                .userTag(ip.getUserTag())
                                                .profileImageUrl(ip.getProfileImageUrl())
                                                .splitAmount(ip.getSplitAmount())
                                                .quantity(ip.getQuantity())
                                                .build())
                                        .toList())
                                .build())
                        .toList())
                .build();
    }

    @Override
    @Transactional
    public void deleteExpense(Long roomId, Long expenseId) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        if (!expense.getStatus().equals("PENDING")) {
            throw new CustomException(ErrorCode.EXPENSE_CANNOT_MODIFY);
        }
        expenseRepository.delete(expense);
    }

    @Override
    @Transactional
    public void updateExpense(Long roomId, Long expenseId, ExpenseRegistrationRequest request) {
        Expense expense = findExpenseWithRoomCheck(roomId, expenseId);
        if (!expense.getStatus().equals("PENDING")) {
            throw new CustomException(ErrorCode.EXPENSE_CANNOT_MODIFY);
        }

        // [1] 수정 요청 데이터 검증함.
        validateRegistration(request);

        // [2] 원장 업데이트함.
        expense.updateBasicInfo(request.getTitle(), request.getTotalAmount(), request.getPaidAt(), request.getReceiptImageUrl());

        // [3] 자식 데이터 갱신함.
        expense.getParticipants().clear();
        expense.getItems().clear();
        entityManager.flush();
        
        addParticipantsAndItems(request, expense);
    }

    /**
     * 등록 및 수정 시 공통 검증 로직임.
     */
    private void validateRegistration(ExpenseRegistrationRequest request) {
        // 1. 세션 유효성 확인: 회차가 해당 방의 소속인지 확인함.
        RoomSession session = roomSessionRepository.findById(request.getRoomSessionId())
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (!session.getRoomId().equals(request.getRoomId())) {
            throw new CustomException(ErrorCode.ROOM_SESSION_MISMATCH);
        }

        // 2. 전체 금액 일치 확인함.
        int totalSplit = request.getParticipants().stream()
                .mapToInt(ExpenseRegistrationRequest.ParticipantRequest::getSplitAmount)
                .sum();
        if (totalSplit != request.getTotalAmount()) {
            throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
        }

        // 3. 참여자 멤버십 확인: 모든 참여자가 방 멤버인지 확인함.
        List<Long> memberIds = roomParticipantRepository.findUserIdsByRoomId(request.getRoomId());
        Set<Long> memberSet = new HashSet<>(memberIds);
        request.getParticipants().forEach(p -> {
            if (!memberSet.contains(p.getUserId())) {
                throw new CustomException(ErrorCode.ROOM_PARTICIPANT_NOT_FOUND);
            }
        });

        // 4. 품목별 금액 일치 확인함 (items 존재 시).
        if (request.getItems() != null) {
            request.getItems().forEach(item -> {
                int itemSum = item.getSplits().stream().mapToInt(s -> s.getSplitAmount()).sum();
                if (itemSum != item.getTotalAmount()) {
                    throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
                }
            });
        }
    }

    private void addParticipantsAndItems(ExpenseRegistrationRequest request, Expense expense) {
        request.getParticipants().forEach(p -> {
            ExpenseParticipant participant = ExpenseParticipant.builder()
                    .expense(expense).userId(p.getUserId()).userName(p.getUserName())
                    .userTag(p.getUserTag()).profileImageUrl(p.getProfileImageUrl()).splitAmount(p.getSplitAmount()).build();
            expense.getParticipants().add(participant);
        });

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            mapItems(request, expense);
        }
    }

    private Expense findExpenseWithRoomCheck(Long roomId, Long expenseId) {
        Expense expense = expenseRepository.findById(expenseId).orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));
        if (!expense.getRoomId().equals(roomId)) {
            throw new CustomException(ErrorCode.ROOM_NOT_FOUND);
        }
        return expense;
    }

    private void mapItems(ExpenseRegistrationRequest request, Expense expense) {
        request.getItems().forEach(itemDto -> {
            ExpenseItem item = ExpenseItem.builder().expense(expense).name(itemDto.getName())
                    .totalAmount(itemDto.getTotalAmount()).quantity(itemDto.getQuantity()).build();

            itemDto.getSplits().forEach(splitDto -> {
                ExpenseItemParticipant itemParticipant = ExpenseItemParticipant.builder()
                        .expenseItem(item).userId(splitDto.getUserId())
                        .userName("임시 참여자") // TODO: participants 스냅샷 매칭 로직 추가 가능함.
                        .userTag("#000").splitAmount(splitDto.getSplitAmount()).quantity(splitDto.getQuantity()).build();
                item.getItemParticipants().add(itemParticipant);
            });
            expense.getItems().add(item);
        });
    }

    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
