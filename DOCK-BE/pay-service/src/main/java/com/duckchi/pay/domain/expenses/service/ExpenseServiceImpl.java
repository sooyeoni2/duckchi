package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.external.FinanceHeader;
import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryResponse;
import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.client.FinanceClient;
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

    @Value("${finance.api.key}") // 환경변수(.env)에서 관리자 키 주입받음. 보안상 소스코드 하드코딩 방지함.
    private String apiKey;

    @Override
    public List<AccountHistoryResponse> getAccountHistory(AccountHistoryRequest request, String userKey) {
        
        // [1] 금융망 요청 헤더 생성
        // "inquireTransactionHistoryList": 금융망 가이드에 정의된 고정 전문 규격 명칭임.
        FinanceHeader header = FinanceHeader.createHeader(
                "inquireTransactionHistoryList", 
                "inquireTransactionHistoryList", 
                apiKey, 
                userKey
        );

        // [2] 조회 기간 자동 설정
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        
        // minusDays(7): 최근 일주일치를 기본 조회 범위로 설정함.
        // 이유: 초기 부하 방지 및 대부분의 모임 정산이 최근 일주일 내 발생하기 때문임.
        String weekAgo = LocalDateTime.now().minusDays(7).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // [3] 외부 API 요청 DTO 구성 (리팩토링된 소문자 필드명 사용함)
        TransactionHistoryRequest externalRequest = TransactionHistoryRequest.builder()
                .header(header)
                .accountNo(request.getAccountNo())
                .startDate(weekAgo) 
                .endDate(today)     
                /**
                 * transactionType("D"): 출금 내역만 조회함.
                 * 이유: 사용자가 정산할 "내가 돈을 보낸 정보"만 필요하기 때문임. (M: 입금, D: 출금, A: 전체)
                 */
                .transactionType("D") 
                // orderByType("DESC"): 최신순 정렬임. 방금 결제한 내역을 최상단에 노출하여 사용자 편의성 증대함.
                .orderByType("DESC")  
                .build();

        // [4] 외부 API 호출 및 상세 예외 처리
        TransactionHistoryResponse response;
        try {
            response = financeClient.fetchTransactionHistory(externalRequest);
        } catch (Exception e) {
            // 통신 실패 시 로그를 남기고 비즈니스 의미가 담긴 커스텀 예외를 던져 보안성과 가독성 확보함.
            log.error("Finance API Call Failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.FINANCE_API_ERROR); 
        }

        // [5] 응답 데이터 검증 (리팩토링된 소문자 필드명 사용함)
        if (response == null || response.getRec() == null) {
            log.warn("No transaction history found for account: {}", request.getAccountNo());
            return List.of(); // null 대신 빈 리스트를 반환하여 호출측의 NullPointerException 방지함.
        }

        // [6] 데이터 매핑 (String -> 내부 표준 타입)
        try {
            return response.getRec().getList().stream()
                    .map(detail -> AccountHistoryResponse.builder()
                            .transactionMemo(detail.getTransactionSummary()) // 거래 적요(가맹점명 등) 추출함.
                            .amount(Integer.parseInt(detail.getTransactionBalance())) // 연산 가능한 Integer로 변환함.
                            .transactionAt(parseLocalDateTime(detail.getTransactionDate(), detail.getTransactionTime())) // 날짜/시간 객체화함.
                            .counterAccountNo(detail.getTransactionAccountNo()) 
                            .build())
                    .toList(); // Java 17 최적화: 불변 리스트 반환 및 가독성 향상함.
        } catch (Exception e) {
            // 외부 데이터 형식이 예상과 다를 경우(포맷 오류 등) 서버 내부 에러로 로깅함.
            log.error("Data Mapping Failed: {}", e.getMessage());
            throw new CustomException(ErrorCode.COMMON_INTERNAL_ERROR); 
        }
    }

    /**
     * 문자열("20260312", "143000")을 LocalDateTime 객체로 파싱함.
     * 이유: 자바 표준 API를 활용해야 정렬, 비교 등 비즈니스 로직 연산이 가능함.
     */
    private LocalDateTime parseLocalDateTime(String date, String time) {
        return LocalDateTime.parse(date + time, DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
    }
}
