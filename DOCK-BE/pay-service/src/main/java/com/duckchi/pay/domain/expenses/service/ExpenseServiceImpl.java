package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.external.FinanceHeader;
import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryResponse;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.infra.client.FinanceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 결제 관리 서비스 구현체.
 */
@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final FinanceClient financeClient;
    private final ExpenseRepository expenseRepository;

    @Value("${finance.api.key}") // 환경변수(.env)에서 관리자 키 주입받음. 보안상 소스코드 하드코딩 금지임.
    private String apiKey;

    @Override
    public List<AccountHistoryResponse> getAccountHistory(String accountNo, String userKey) {
        
        // [1] 금융망 요청 헤더 생성
        // - "inquireTransactionHistoryList": 금융망 가이드에 정의된 고정 API 명칭임.
        FinanceHeader header = FinanceHeader.createHeader(
                "inquireTransactionHistoryList", 
                "inquireTransactionHistoryList", 
                apiKey, 
                userKey
        );

        // [2] 조회 파라미터 설정
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String weekAgo = LocalDateTime.now().minusDays(7).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        TransactionHistoryRequest request = TransactionHistoryRequest.builder()
                .Header(header)
                .accountNo(accountNo)
                .startDate(weekAgo) 
                .endDate(today)     
                /**
                 * transactionType("D"): 출금 내역만 조회함.
                 * - SSAFY 금융망 Spec: M(입금), D(출금), A(전체)임.
                 * - "카드결제나 계좌이체 등 내가 돈을 보낸 정보"를 가져오기 위해 D(출금)로 설정함.
                 */
                .transactionType("D") 
                .orderByType("DESC")  // 최신순 정렬하여 사용자가 방금 결제한 건을 먼저 보게 함.
                .build();

        // [3] 외부 API 호출 (Feign Client)
        TransactionHistoryResponse response = financeClient.fetchTransactionHistory(request);

        // [4] 응답 결과 가공 및 예외 방지
        if (response == null || response.getREC() == null) {
            return List.of(); // null 대신 빈 리스트 반환하여 후속 로직의 NullPointerException 방지함.
        }

        // [5] 외부 규격(String) -> 내부 규격(Integer, LocalDateTime) 변환
        return response.getREC().getList().stream()
                .map(detail -> AccountHistoryResponse.builder()
                        .transactionMemo(detail.getTransactionSummary()) // 거래 적요(식당명 등) 추출함.
                        .amount(Integer.parseInt(detail.getTransactionBalance())) // 문자열 금액을 숫자로 변환함.
                        .transactionAt(parseLocalDateTime(detail.getTransactionDate(), detail.getTransactionTime())) // 날짜/시간 병합 파싱함.
                        .counterAccountNo(detail.getTransactionAccountNo()) // 상대방 계좌번호임.
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 문자열 날짜("20260312")와 시간("143000")을 객체("2026-03-12T14:30:00")로 변환함.
     * 이유: 자바 표준 LocalDateTime을 사용해야 정렬 및 시간 비교 연산이 가능함.
     */
    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
