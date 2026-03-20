package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomSession;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomSessionRepository;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.duckchi.pay.infra.client.CoreClient;
import com.duckchi.pay.infra.finance.FinanceClient;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    private static final Long TEST_USER_ID = 1L;
    private static final Long ROOM_ID = 1L;

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
    private CoreClient coreClient;

    @Mock
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(expenseService, "entityManager", entityManager);
        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("Uses finance profile from core-service for account history")
    void getAccountHistorySuccess() {
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "1", "20260312", "143000", "D", "withdrawal", "987-654-321", "50000", "100000", "starbucks", ""
        );
        TransactionHistoryResponse.TransactionResultBody body = new TransactionHistoryResponse.TransactionResultBody(
                "1", List.of(detail)
        );
        TransactionHistoryResponse mockResponse = new TransactionHistoryResponse(null, body);

        when(coreClient.getUserFinanceProfile(TEST_USER_ID)).thenReturn(
                ApiResponseDto.success(
                        UserFinanceProfileResponse.builder()
                                .ssafyUserKey("mock-user-key")
                                .accountNo("1234567890123456")
                                .build()
                )
        );
        when(financeClient.fetchTransactionHistory(any())).thenReturn(mockResponse);

        AccountHistoryRequest request = AccountHistoryRequest.builder()
                .accountNo("1234567890123456")
                .build();

        List<AccountHistoryResponse> result = expenseService.getAccountHistory(TEST_USER_ID, request);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("starbucks");
        verify(coreClient).getUserFinanceProfile(TEST_USER_ID);
        verify(financeClient).fetchTransactionHistory(argThat(argument ->
                "1234567890123456".equals(argument.getAccountNo())
        ));
    }

    @Test
    @DisplayName("Loads participant options for expense registration")
    void getExpenseParticipantsSuccess() {
        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(true);
        when(roomParticipantRepository.findUserIdsByRoomId(ROOM_ID)).thenReturn(List.of(1L, 2L));
        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(1L, "payer", "#1A3"),
                userProfile(2L, "friend", "#2B4")
        )));

        List<ExpenseParticipantOptionResponse> result = expenseService.getExpenseParticipants(TEST_USER_ID, ROOM_ID);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUserName()).isEqualTo("payer");
        assertThat(result.get(1).getUserTag()).isEqualTo("#2B4");
    }

    @Test
    @DisplayName("Registers an expense using snapshots fetched from core-service")
    void registerExpenseSuccess() {
        ExpenseUpsertRequest.ParticipantSplitRequest payer = ExpenseUpsertRequest.ParticipantSplitRequest.builder()
                .userId(TEST_USER_ID)
                .splitAmount(5000)
                .build();

        ExpenseUpsertRequest request = ExpenseUpsertRequest.builder()
                .roomSessionId(1L)
                .title("expense")
                .totalAmount(5000)
                .inputType("MANUAL")
                .participants(List.of(payer))
                .build();

        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(roomSession(1L, ROOM_ID)));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(true);
        when(roomParticipantRepository.findUserIdsByRoomId(ROOM_ID)).thenReturn(List.of(TEST_USER_ID));
        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(TEST_USER_ID, "payer", "#1A3")
        )));
        when(expenseRepository.save(any(Expense.class))).thenReturn(Expense.builder().id(100L).build());

        Long savedId = expenseService.registerExpense(TEST_USER_ID, ROOM_ID, request);

        assertThat(savedId).isEqualTo(100L);
        verify(expenseRepository).save(argThat(expense ->
                expense.getPayerUserId().equals(TEST_USER_ID)
                        && expense.getPayerUserName().equals("payer")
                        && expense.getParticipants().get(0).getUserTag().equals("#1A3")
        ));
    }

    @Test
    @DisplayName("Rejects deleting an expense created by another user")
    void deleteExpenseForbidden() {
        Expense existingExpense = Expense.builder()
                .id(1L)
                .roomId(ROOM_ID)
                .payerUserId(999L)
                .status("PENDING")
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));

        assertThatThrownBy(() -> expenseService.deleteExpense(TEST_USER_ID, ROOM_ID, 1L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COMMON_FORBIDDEN);
    }

    @Test
    @DisplayName("Updates a pending expense and refreshes snapshots from core-service")
    void updateExpenseSuccess() {
        Expense existingExpense = Expense.builder()
                .id(1L)
                .roomId(ROOM_ID)
                .payerUserId(TEST_USER_ID)
                .status("PENDING")
                .totalAmount(10000)
                .build();

        ExpenseUpsertRequest.ParticipantSplitRequest payer = ExpenseUpsertRequest.ParticipantSplitRequest.builder()
                .userId(TEST_USER_ID)
                .splitAmount(5000)
                .build();
        ExpenseUpsertRequest request = ExpenseUpsertRequest.builder()
                .roomSessionId(1L)
                .title("updated")
                .totalAmount(5000)
                .inputType("MANUAL")
                .participants(List.of(payer))
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));
        when(roomSessionRepository.findById(1L)).thenReturn(Optional.of(roomSession(1L, ROOM_ID)));
        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(true);
        when(roomParticipantRepository.findUserIdsByRoomId(ROOM_ID)).thenReturn(List.of(TEST_USER_ID));
        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(TEST_USER_ID, "payer-updated", "#9Z9")
        )));

        expenseService.updateExpense(TEST_USER_ID, ROOM_ID, 1L, request);

        assertThat(existingExpense.getTotalAmount()).isEqualTo(5000);
        verify(entityManager).flush();
    }

    @Test
    @DisplayName("Rejects room expense list lookup by non-member")
    void getExpensesByRoomForbidden() {
        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(false);

        assertThatThrownBy(() -> expenseService.getExpensesByRoom(TEST_USER_ID, ROOM_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROOM_MEMBER_ONLY);
    }

    @Test
    @DisplayName("Loads only my expenses inside a room")
    void getMyExpensesByRoomSuccess() {
        Expense expense = Expense.builder()
                .id(10L)
                .roomId(ROOM_ID)
                .roomSessionId(2L)
                .payerUserId(TEST_USER_ID)
                .payerUserName("payer")
                .title("my-expense")
                .totalAmount(10000)
                .inputType("MANUAL")
                .status("PENDING")
                .paidAt(LocalDateTime.of(2026, 3, 12, 14, 30))
                .createdAt(LocalDateTime.of(2026, 3, 13, 10, 0))
                .build();

        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(true);
        when(expenseRepository.findAllByRoomIdAndPayerUserIdOrderByCreatedAtDesc(ROOM_ID, TEST_USER_ID))
                .thenReturn(List.of(expense));

        List<ExpenseResponse> result = expenseService.getMyExpensesByRoom(TEST_USER_ID, ROOM_ID);

        assertThat(result).singleElement().satisfies(response -> {
            assertThat(response.getExpenseId()).isEqualTo(10L);
            assertThat(response.getTitle()).isEqualTo("my-expense");
        });
    }

    @Test
    @DisplayName("Rejects expense detail lookup by non-member")
    void getExpenseDetailForbidden() {
        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(false);

        assertThatThrownBy(() -> expenseService.getExpenseDetail(TEST_USER_ID, ROOM_ID, 1L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROOM_MEMBER_ONLY);
    }

    @Test
    @DisplayName("Loads expense detail for room member")
    void getExpenseDetailSuccess() {
        Expense expense = Expense.builder()
                .id(1L)
                .roomId(ROOM_ID)
                .roomSessionId(2L)
                .payerUserId(TEST_USER_ID)
                .payerUserName("payer")
                .title("detail-expense")
                .totalAmount(10000)
                .inputType("MANUAL")
                .status("PENDING")
                .paidAt(LocalDateTime.of(2026, 3, 12, 14, 30))
                .build();

        when(roomParticipantRepository.existsByRoom_IdAndUserId(ROOM_ID, TEST_USER_ID)).thenReturn(true);
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(expense));

        ExpenseDetailResponse result = expenseService.getExpenseDetail(TEST_USER_ID, ROOM_ID, 1L);

        assertThat(result.getExpenseId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("detail-expense");
        assertThat(result.getParticipants()).isEmpty();
        assertThat(result.getItems()).isEmpty();
    }

    private UserProfileSnapshotResponse userProfile(Long userId, String userName, String userTag) {
        return UserProfileSnapshotResponse.builder()
                .userId(userId)
                .userName(userName)
                .userTag(userTag)
                .profileImageUrl("https://cdn.example.com/" + userId + ".png")
                .build();
    }

    private RoomSession roomSession(Long sessionId, Long roomId) {
        return RoomSession.builder()
                .id(sessionId)
                .room(room(roomId))
                .build();
    }

    private Room room(Long roomId) {
        Room room = Room.builder()
                .name("test-room")
                .category("ETC")
                .description("test")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }
}
