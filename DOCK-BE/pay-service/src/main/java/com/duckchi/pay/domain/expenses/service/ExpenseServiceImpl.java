package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 결제 관리 서비스 구현체.
 * 금융망 연동 및 데이터 변환 로직 담당함.
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

        // [3] 외부 API 요청 DTO 구성 (신규 패키지 DTO 사용함)
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

    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
