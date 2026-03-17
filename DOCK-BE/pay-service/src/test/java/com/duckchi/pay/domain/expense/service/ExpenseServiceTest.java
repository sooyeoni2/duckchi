package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseRegistrationRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
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
 * [결제 관리 서비스 단위 테스트]
 * 
 * 1. MockitoExtension: Spring 컨텍스트를 띄우지 않고 가짜 객체(Mock)를 활용해 
 *    순수 비즈니스 로직만 빠르게 테스트함 (테스트 속도 최적화).
 * 2. @InjectMocks: 테스트 대상인 서비스 객체에 @Mock으로 선언된 가짜 의존성들을 주입함.
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

    /**
     * [EntityManager Mocking 이유]
     * - 정의: JPA에서 영속성 컨텍스트(Persistence Context)에 접근하는 핵심 인터페이스임.
     * - 필요성: 서비스 로직 내에서 엔티티의 변경 사항을 DB에 즉시 동기화하기 위해 flush()를 직접 호출함.
     * - 고려사항: 단위 테스트에서는 실제 DB가 없으므로 EntityManager도 가짜(Mock)로 만들어 
     *   NPE(NullPointerException)를 방지하고 flush() 호출 여부만 검증함.
     */
    @Mock
    private EntityManager entityManager;

    /**
     * [테스트 전처리: setUp]
     * - ReflectionTestUtils: @Value로 주입되는 값이나 @PersistenceContext 필드처럼 
     *   일반적인 생성자 주입으로 채워지지 않는 'Private 필드'에 가짜 값을 강제로 주입함.
     * - 주의사항: 필드명이 실제 서비스 코드와 정확히 일치해야 함.
     */
    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(expenseService, "entityManager", entityManager);
        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("금융망 거래 내역을 조회하여 내부 응답 규격으로 변환함")
    void getAccountHistory_Success() {
        // [Arrange] 가짜 외부 응답 데이터 설정
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "1", "20260312", "143000", "D", "출금", "987-654-321", "50000", "100000", "스타벅스", ""
        );
        TransactionHistoryResponse.TransactionResultBody body = new TransactionHistoryResponse.TransactionResultBody(
                "1", List.of(detail)
        );
        TransactionHistoryResponse mockResponse = new TransactionHistoryResponse(null, body);

        // Stubbing: financeClient가 호출되면 미리 정의한 mockResponse를 반환하도록 함.
        when(financeClient.fetchTransactionHistory(any())).thenReturn(mockResponse);

        // [Act] 테스트 대상 메서드 실행
        AccountHistoryRequest request = AccountHistoryRequest.builder()
                .accountNo("1234567890123456")
                .build();
        List<AccountHistoryResponse> result = expenseService.getAccountHistory(request, "user-key");

        // [Assert] 결과가 예상대로 변환되었는지 확인
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("스타벅스");
    }

    @Test
    @DisplayName("정상적인 데이터로 결제안 등록 요청 시 성공함")
    void registerExpense_Success() {
        // [Arrange] 요청 DTO 및 연관 데이터 Mock 설정
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).userName("강산천").userTag("#1A3").splitAmount(5000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).userName("정우주").userTag("#2B4").splitAmount(5000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).title("테스트결제").totalAmount(10000)
                .inputType("MANUAL").participants(List.of(p1, p2)).build();

        // 내부 무결성 검증을 통과시키기 위한 Stubbing
        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(roomParticipantRepository.findUserIdsByRoomId(1L)).thenReturn(List.of(1L, 2L));
        
        Expense mockSavedExpense = Expense.builder().id(100L).build();
        when(expenseRepository.save(any(Expense.class))).thenReturn(mockSavedExpense);

        // [Act] 실행
        Long savedId = expenseService.registerExpense(request);

        // [Assert] 검증
        assertThat(savedId).isEqualTo(100L);
        // DB 저장 메서드가 정확히 한 번 실행되었는지 확인함.
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    @DisplayName("참여자 분담금 합계가 총액과 다르면 등록에 실패함")
    void registerExpense_Fail_AmountMismatch() {
        // [Arrange] 금액이 맞지 않는 요청 (5000 + 4000 != 10000)
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).splitAmount(5000).build();
        ExpenseRegistrationRequest.ParticipantRequest p2 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(2L).splitAmount(4000).build();

        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).title("테스트결제").totalAmount(10000)
                .participants(List.of(p1, p2)).build();

        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));

        // [Act & Assert] CustomException이 발생하며 에러 코드가 일치하는지 확인
        assertThatThrownBy(() -> expenseService.registerExpense(request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPENSE_AMOUNT_MISMATCH);
    }

    /**
     * [지출 수정 테스트의 핵심 흐름]
     * 1. 기존 데이터 조회 -> 2. 기본 정보 변경 -> 3. 자식 리스트(참여자, 품목) 초기화
     * 4. entityManager.flush() 실행 -> 5. 신규 참여자 추가
     * 
     * [flush()의 역할]
     * - JPA는 쓰기 지연(Write-Behind) 저장소를 사용하므로, 리스트를 비우고 다시 채울 때 
     *   DB에 이 순서가 보장되지 않으면 데이터 꼬임이나 제약 조건 위반이 발생할 수 있음.
     * - flush()를 통해 비우는 작업을 즉시 SQL로 변환하여 DB에 전달함.
     */
    @Test
    @DisplayName("대기 중인 결제안을 성공적으로 수정함")
    void updateExpense_Success() {
        // [Arrange]
        Expense existingExpense = Expense.builder()
                .id(1L).roomId(1L).status("PENDING").totalAmount(10000).build();
        
        ExpenseRegistrationRequest.ParticipantRequest p1 = ExpenseRegistrationRequest.ParticipantRequest.builder()
                .userId(1L).splitAmount(5000).build();
        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder()
                .roomId(1L).roomSessionId(1L).totalAmount(5000).participants(List.of(p1)).build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));
        RoomSession mockSession = RoomSession.builder().id(1L).roomId(1L).build();
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(roomParticipantRepository.findUserIdsByRoomId(1L)).thenReturn(List.of(1L));

        // [Act]
        expenseService.updateExpense(1L, 1L, request);

        // [Assert]
        assertThat(existingExpense.getTotalAmount()).isEqualTo(5000);
        // 영속성 컨텍스트 동기화(flush)가 명시적으로 호출되었는지 검증함.
        verify(entityManager, times(1)).flush();
    }

    @Test
    @DisplayName("이미 정산 요청된 결제안은 수정 시 예외가 발생함")
    void updateExpense_Fail_AlreadyRequested() {
        // [Arrange] 상태가 PENDING이 아닌 데이터
        Expense existingExpense = Expense.builder()
                .id(1L).roomId(1L).status("REQUESTED").build();
        ExpenseRegistrationRequest request = ExpenseRegistrationRequest.builder().build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));

        // [Act & Assert]
        assertThatThrownBy(() -> expenseService.updateExpense(1L, 1L, request))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EXPENSE_CANNOT_MODIFY);
    }
}
