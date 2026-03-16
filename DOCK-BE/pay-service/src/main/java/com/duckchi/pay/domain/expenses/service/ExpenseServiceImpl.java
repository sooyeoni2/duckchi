package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.entity.Expense;
import com.duckchi.pay.domain.expenses.entity.ExpenseItem;
import com.duckchi.pay.domain.expenses.entity.ExpenseItemParticipant;
import com.duckchi.pay.domain.expenses.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.request.FinanceRequestHeader;
import com.duckchi.pay.infra.finance.dto.request.TransactionHistoryRequest;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 결제 관리 서비스 구현체.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FinanceClient financeClient;
    private final ExpenseRepository expenseRepository;

    @Value("${finance.api.key}")
    private String apiKey;

    @Override
    @Transactional(readOnly = true)
    public List<AccountHistoryResponse> getAccountHistory(AccountHistoryRequest request, String userKey) {
        
        // [1] 금융망 요청 헤더 생성
        FinanceRequestHeader header = FinanceRequestHeader.createHeader(
                "inquireTransactionHistoryList", 
                "inquireTransactionHistoryList", 
                apiKey, 
                userKey
        );

        // [2] 조회 기간 자동 설정 (최근 7일)
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String weekAgo = LocalDateTime.now().minusDays(7).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // [3] 외부 API 요청 DTO 구성
        TransactionHistoryRequest externalRequest = TransactionHistoryRequest.builder()
                .header(header)
                .accountNo(request.getAccountNo())
                .startDate(weekAgo) 
                .endDate(today)     
                .transactionType("D") 
                .orderByType("DESC")  
                .build();

        // [4] 외부 API 호출 및 상세 예외 처리
        TransactionHistoryResponse response;
        try {
            response = financeClient.fetchTransactionHistory(externalRequest);
        } catch (Exception e) {
            log.error("Finance API Call Failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.FINANCE_API_ERROR); 
        }

        // [5] 응답 데이터 검증
        if (response == null || response.getRec() == null) {
            log.warn("No transaction history found for account: {}", request.getAccountNo());
            return List.of(); 
        }

        // [6] 데이터 매핑 (String -> 내부 표준 타입)
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
        // [1] 전체 금액 검증 (무결성 확인)
        validateTotalAmount(request);

        // [2] 결제 원장(Expense) 엔티티 생성
        // TODO: 유저 연동(Gateway) 완료 후 payer 정보를 실제 로그인 유저로 변경해야 함.
        Expense expense = Expense.builder()
                .roomId(request.getRoomId())
                .roomSessionId(request.getRoomSessionId())
                .payerUserId(1L) // 임시 하드코딩함.
                .payerUserName("임시 결제자")
                .inputType(request.getInputType())
                .title(request.getTitle())
                .totalAmount(request.getTotalAmount())
                .paidAt(request.getPaidAt())
                .build();

        // [3] 최종 참여자 합계 정보 매핑 (participants)
        request.getParticipants().forEach(p -> {
            ExpenseParticipant participant = ExpenseParticipant.builder()
                    .expense(expense)
                    .userId(p.getUserId())
                    .userName(p.getUserName())
                    .userTag(p.getUserTag())
                    .profileImageUrl(p.getProfileImageUrl())
                    .splitAmount(p.getSplitAmount())
                    .build();
            expense.getParticipants().add(participant);
        });

        // [4] 상세 품목 정보 매핑 (items - OCR 등 상세 정산 시)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            mapItems(request, expense);
        }

        // [5] 저장 (CascadeType.ALL에 의해 하위 정보 동시 저장됨)
        Expense savedExpense = expenseRepository.save(expense);
        return savedExpense.getId();
    }

    /**
     * 참여자별 분담 금액 합계가 총 결제 금액과 일치하는지 검증함.
     */
    private void validateTotalAmount(ExpenseRegistrationRequest request) {
        int totalSplit = request.getParticipants().stream()
                .mapToInt(ExpenseRegistrationRequest.ParticipantRequest::getSplitAmount)
                .sum();

        if (totalSplit != request.getTotalAmount()) {
            log.error("Amount Mismatch: Total={}, Sum={}", request.getTotalAmount(), totalSplit);
            throw new CustomException(ErrorCode.EXPENSE_AMOUNT_MISMATCH);
        }
    }

    /**
     * DTO의 품목 리스트를 엔티티 구조로 변환함.
     */
    private void mapItems(ExpenseRegistrationRequest request, Expense expense) {
        request.getItems().forEach(itemDto -> {
            ExpenseItem item = ExpenseItem.builder()
                    .expense(expense)
                    .name(itemDto.getName())
                    .totalAmount(itemDto.getTotalAmount())
                    .quantity(itemDto.getQuantity())
                    .build();

            itemDto.getSplits().forEach(splitDto -> {
                ExpenseItemParticipant itemParticipant = ExpenseItemParticipant.builder()
                        .expenseItem(item)
                        .userId(splitDto.getUserId())
                        .userName("임시 참여자") // TODO: participants 스냅샷에서 매칭 기능 구현 가능함.
                        .userTag("#000")
                        .splitAmount(splitDto.getSplitAmount())
                        .quantity(splitDto.getQuantity())
                        .build();
                item.getItemParticipants().add(itemParticipant);
            });
            expense.getItems().add(item);
        });
    }

    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
