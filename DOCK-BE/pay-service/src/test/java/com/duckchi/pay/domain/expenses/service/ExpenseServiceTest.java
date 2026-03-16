package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.entity.Expense;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 결제 관리 서비스 단위 테스트.
 * 
 * [@ExtendWith(MockitoExtension.class)]
 * - JUnit 5와 Mockito를 연동해주는 설정임.
 * - @Mock, @InjectMocks 어노테이션이 작동하도록 테스트 환경을 확장함.
 */
@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @InjectMocks
    private ExpenseServiceImpl expenseService; // 테스트 대상임. 가짜 객체들이 이곳에 주입됨.

    @Mock
    private FinanceClient financeClient; // 외부 금융망 통신을 대신할 가짜 클라이언트임.

    @Mock
    private ExpenseRepository expenseRepository; // DB 연동을 대신할 가짜 레포지토리임.

    @Test
    @DisplayName("금융망 거래 내역을 조회하여 내부 응답 규격으로 변환함")
    void getAccountHistory_Success() {
        // [1] 가짜 외부 응답 데이터(Mock) 생성함.
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "1", "20260312", "143000", "D", "출금", "987-654-321", "50000", "100000", "스타벅스", ""
        );
        TransactionHistoryResponse.TransactionResultBody body = new TransactionHistoryResponse.TransactionResultBody(
                "1", List.of(detail)
        );
        TransactionHistoryResponse mockResponse = new TransactionHistoryResponse(null, body);

        // [2] Mock 동작 설정함.
        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
        when(financeClient.fetchTransactionHistory(any())).thenReturn(mockResponse);

        // [3] 서비스 메서드 실행함.
        AccountHistoryRequest request = AccountHistoryRequest.builder()
                .accountNo("1234567890123456")
                .build();
        List<AccountHistoryResponse> result = expenseService.getAccountHistory(request, "user-key");

        // [4] 결과 검증함.
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("스타벅스");
        assertThat(result.get(0).getAmount()).isEqualTo(50000);
        assertThat(result.get(0).getTransactionAt()).hasToString("2026-03-12T14:30");
    }

    @Test
    @DisplayName("정상적인 데이터로 결제 등록 요청 시 성공함")
    void registerExpense_Success() {
        // [1] 요청 DTO 생성함.
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).userName("강산천").userTag("#1A3").splitAmount(5000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).userName("정우주").userTag("#2B4").splitAmount(5000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).title("테스트결제").totalAmount(10000)
                .inputType("MANUAL").participants(List.of(p1, p2)).build();

        // [2] Mock 동작 설정함.
        Expense mockSavedExpense = Expense.builder().id(100L).build();
        when(expenseRepository.save(any(Expense.class))).thenReturn(mockSavedExpense);

        // [3] 서비스 메서드 실행함.
        Long savedId = expenseService.registerExpense(request);

        // [4] 결과 검증함.
        assertThat(savedId).isEqualTo(100L);
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    @DisplayName("참여자 분담금 합계가 총액과 다르면 등록에 실패함")
    void registerExpense_Fail_AmountMismatch() {
        // [1] 총액은 10000인데 합계는 9000인 잘못된 요청 생성함.
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).splitAmount(4000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).splitAmount(5000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .totalAmount(10000).participants(List.of(p1, p2)).build();

        // [2] 실행 및 예외 검증함.
        assertThatThrownBy(() -> expenseService.registerExpense(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPENSE_AMOUNT_MISMATCH);

        // [3] DB 저장이 호출되지 않았는지 확인함.
        verify(expenseRepository, never()).save(any());
    }
}
