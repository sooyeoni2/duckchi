package com.duckchi.pay.domain.expenses.service;

import com.duckchi.pay.domain.expenses.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expenses.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expenses.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expenses.entity.Expense;
import com.duckchi.pay.domain.expenses.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * 결제 관리 서비스 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @InjectMocks
    private ExpenseServiceImpl expenseService;

    @Mock
    private FinanceClient financeClient;

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private RoomSessionRepository roomSessionRepository;

    @Mock
    private RoomParticipantRepository roomParticipantRepository;

    @Mock
    private EntityManager entityManager;

    @Test
    @DisplayName("금융망 거래 내역을 조회하여 내부 응답 규격으로 변환함")
    void getAccountHistory_Success() {
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "1", "20260312", "143000", "D", "출금", "987-654-321", "50000", "100000", "스타벅스", ""
        );
        TransactionHistoryResponse.TransactionResultBody body = new TransactionHistoryResponse.TransactionResultBody(
                "1", List.of(detail)
        );
        TransactionHistoryResponse mockResponse = new TransactionHistoryResponse(null, body);

        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
        when(financeClient.fetchTransactionHistory(any())).thenReturn(mockResponse);

        AccountHistoryRequest request = AccountHistoryRequest.builder()
                .accountNo("1234567890123456")
                .build();
        List<AccountHistoryResponse> result = expenseService.getAccountHistory(request, "user-key");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("스타벅스");
    }

    @Test
    @DisplayName("정상적인 데이터로 결제 등록 요청 시 성공함")
    void registerExpense_Success() {
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).userName("강산천").userTag("#1A3").splitAmount(5000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).userName("정우주").userTag("#2B4").splitAmount(5000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).title("테스트결제").totalAmount(10000)
                .inputType("MANUAL").participants(List.of(p1, p2)).build();

        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(roomParticipantRepository.findUserIdsByRoomId(1L)).thenReturn(List.of(1L, 2L));
        
        Expense mockSavedExpense = Expense.builder().id(100L).build();
        when(expenseRepository.save(any(Expense.class))).thenReturn(mockSavedExpense);

        Long savedId = expenseService.registerExpense(request);

        assertThat(savedId).isEqualTo(100L);
    }

    @Test
    @DisplayName("참여자 분담금 합계가 총액과 다르면 등록에 실패함")
    void registerExpense_Fail_AmountMismatch() {
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).splitAmount(5000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).splitAmount(4000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).title("테스트결제").totalAmount(10000)
                .participants(List.of(p1, p2)).build();

        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));

        assertThatThrownBy(() -> expenseService.registerExpense(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPENSE_AMOUNT_MISMATCH);
    }

    @Test
    @DisplayName("대기 중인 결제 내역을 성공적으로 수정함")
    void updateExpense_Success() {
        Expense existingExpense = spy(Expense.builder()
                .id(1L).roomId(1L).status("PENDING").build());
        
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).splitAmount(5000).build();
        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).totalAmount(5000).participants(List.of(p1)).build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));
        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(roomParticipantRepository.findUserIdsByRoomId(1L)).thenReturn(List.of(1L));

        expenseService.updateExpense(1L, 1L, request);

        assertThat(existingExpense.getTotalAmount()).isEqualTo(5000);
    }

    @Test
    @DisplayName("이미 정산 요청된 결제 내역은 수정 시 예외가 발생함")
    void updateExpense_Fail_AlreadyRequested() {
        Expense existingExpense = Expense.builder()
                .id(1L).roomId(1L).status("REQUESTED").build();
        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder().build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));

        assertThatThrownBy(() -> expenseService.updateExpense(1L, 1L, request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPENSE_CANNOT_MODIFY);
    }
}
