package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.external.TransactionHistoryResponse;
import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.infra.client.FinanceClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * 결제 관리 서비스 단위 테스트.
 * 
 * [@ExtendWith(MockitoExtension.class)]
 * - JUnit 5와 Mockito를 연동해주는 설정임.
 * - @Mock, @InjectMocks 어노테이션이 작동하도록 테스트 환경을 확장함.
 * - 가짜 객체의 초기화 및 자원 해제를 자동으로 관리함.
 */
@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @InjectMocks
    private ExpenseServiceImpl expenseService; // 테스트 대상임. 가짜 객체들이 이곳에 주입됨.

    @Mock
    private FinanceClient financeClient; // 외부 금융망 통신을 대신할 가짜 클라이언트임.

    @Test
    @DisplayName("금융망 거래 내역을 조회하여 내부 응답 규격으로 변환함")
    void getAccountHistory_Success() {
        // [1] 가짜 외부 응답 데이터(Mock) 생성함.
        // 금융망 명세에 맞춘 문자열 데이터를 미리 준비함.
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "20260312", "143000", "D", "출금", "987-654-321", "50000", "100000", "스타벅스"
        );
        TransactionHistoryResponse.TransactionResultBody body = new TransactionHistoryResponse.TransactionResultBody(
                "1", List.of(detail)
        );
        TransactionHistoryResponse mockResponse = new TransactionHistoryResponse(null, body);

        // [2] Mock 동작 설정함.
        // - ReflectionTestUtils: private 필드인 @Value(apiKey)에 값을 강제로 주입함.
        // - when(...).thenReturn(...): 특정 메서드 호출 시 가짜 응답을 반환하도록 지정함.
        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
        when(financeClient.fetchTransactionHistory(any())).thenReturn(mockResponse);

        // [3] 서비스 메서드 실행함.
        AccountHistoryRequest request = AccountHistoryRequest.builder()
                .accountNo("1234567890123456")
                .build();
        List<AccountHistoryResponse> result = expenseService.getAccountHistory(request, "user-key");

        // [4] 결과 검증함.
        // 외부 문자열 데이터가 우리 시스템의 타입(Integer 등)으로 잘 파싱되었는지 확인함.
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("스타벅스");
        assertThat(result.get(0).getAmount()).isEqualTo(50000);
        assertThat(result.get(0).getTransactionAt()).hasToString("2026-03-12T14:30");
    }
}
