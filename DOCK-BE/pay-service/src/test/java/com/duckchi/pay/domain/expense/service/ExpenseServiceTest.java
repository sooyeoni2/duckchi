package com.duckchi.pay.domain.expense.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.domain.expense.dto.request.AccountHistoryRequest;
import com.duckchi.pay.domain.expense.dto.request.ExpenseUpsertRequest;
import com.duckchi.pay.domain.expense.dto.response.AccountHistoryResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseDetailResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseParticipantOptionResponse;
import com.duckchi.pay.domain.expense.dto.response.ExpenseResponse;
import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.mapper.ExpenseMapper;
import com.duckchi.pay.domain.expense.repository.ExpenseRepository;
import com.duckchi.pay.domain.expense.validator.ExpenseValidator;
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
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.CacheManager;
import org.springframework.test.util.ReflectionTestUtils;

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
    private ExpenseValidator expenseValidator;

    @Spy
    private ExpenseMapper expenseMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(expenseService, "entityManager", entityManager);
        ReflectionTestUtils.setField(expenseService, "apiKey", "test-api-key");
    }

    @Test
    @DisplayName("코어 서비스 금융 프로필 기준으로 계좌 내역을 조회함")
    void getAccountHistorySuccess() {
        TransactionHistoryResponse.TransactionDetail detail = new TransactionHistoryResponse.TransactionDetail(
                "1", "20260312", "143000", "D", "withdrawal", "987-654-321", "50000", "100000", "덕치정육식당", ""
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
        assertThat(result.get(0).getTransactionMemo()).isEqualTo("덕치정육식당");
    }

    @Test
    @DisplayName("결제안 등록용 참여자 선택 목록을 조회함")
    void getExpenseParticipantsSuccess() {
        when(roomParticipantRepository.findUserIdsByRoomId(ROOM_ID)).thenReturn(List.of(1L, 2L));
        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(1L, "강산천", "#1A3"),
                userProfile(2L, "이정민", "#2B4")
        )));

        List<ExpenseParticipantOptionResponse> result = expenseService.getExpenseParticipants(TEST_USER_ID, ROOM_ID);

        assertThat(result).hasSize(2);
        verify(expenseValidator).validateRoomMember(ROOM_ID, TEST_USER_ID);
    }

    @Test
    @DisplayName("코어 서비스 사용자 스냅샷을 반영해 결제안을 등록함")
    void registerExpenseSuccess() {
        ExpenseUpsertRequest.ParticipantSplitRequest payer = ExpenseUpsertRequest.ParticipantSplitRequest.builder()
                .userId(TEST_USER_ID)
                .splitAmount(5000)
                .build();

        ExpenseUpsertRequest request = ExpenseUpsertRequest.builder()
                .roomSessionId(1L)
                .title("강남 저녁 회식")
                .totalAmount(5000)
                .inputType("MANUAL")
                .participants(List.of(payer))
                .build();

        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(TEST_USER_ID, "강산천", "#1A3")
        )));
        when(expenseRepository.save(any(Expense.class))).thenReturn(Expense.builder().id(100L).build());

        Long savedId = expenseService.registerExpense(TEST_USER_ID, ROOM_ID, request);

        assertThat(savedId).isEqualTo(100L);
        verify(expenseValidator).validateRegistration(TEST_USER_ID, ROOM_ID, request);
    }

    @Test
    @DisplayName("다른 사용자가 생성한 결제안은 삭제할 수 없음")
    void deleteExpenseForbidden() {
        Expense existingExpense = Expense.builder()
                .id(1L)
                .roomId(ROOM_ID)
                .payerUserId(999L)
                .status("PENDING")
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));
        doThrow(new CustomException(ErrorCode.COMMON_FORBIDDEN))
                .when(expenseValidator).validateEditableByRequester(eq(TEST_USER_ID), any());

        assertThatThrownBy(() -> expenseService.deleteExpense(TEST_USER_ID, ROOM_ID, 1L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COMMON_FORBIDDEN);
    }

    @Test
    @DisplayName("대기 상태 결제안을 수정하고 사용자 스냅샷을 갱신함")
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
                .title("수정된 저녁 회식")
                .totalAmount(5000)
                .inputType("MANUAL")
                .participants(List.of(payer))
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(existingExpense));
        when(coreClient.getUserProfiles(any())).thenReturn(ApiResponseDto.success(List.of(
                userProfile(TEST_USER_ID, "강산천", "#9Z9")
        )));

        expenseService.updateExpense(TEST_USER_ID, ROOM_ID, 1L, request);

        assertThat(existingExpense.getTotalAmount()).isEqualTo(5000);
        verify(expenseValidator).validateRegistration(TEST_USER_ID, ROOM_ID, request);
    }

    @Test
    @DisplayName("방 멤버가 아니면 결제안 목록 조회를 거부함")
    void getExpensesByRoomForbidden() {
        doThrow(new CustomException(ErrorCode.ROOM_MEMBER_ONLY))
                .when(expenseValidator).validateRoomMember(ROOM_ID, TEST_USER_ID);

        assertThatThrownBy(() -> expenseService.getExpensesByRoom(TEST_USER_ID, ROOM_ID))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROOM_MEMBER_ONLY);
    }

    @Test
    @DisplayName("방 멤버가 아니면 결제안 상세 조회를 거부함")
    void getExpenseDetailForbidden() {
        doThrow(new CustomException(ErrorCode.ROOM_MEMBER_ONLY))
                .when(expenseValidator).validateRoomMember(ROOM_ID, TEST_USER_ID);

        assertThatThrownBy(() -> expenseService.getExpenseDetail(TEST_USER_ID, ROOM_ID, 1L))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ROOM_MEMBER_ONLY);
    }

    @Test
    @DisplayName("방 멤버는 결제안 상세를 조회할 수 있음")
    void getExpenseDetailSuccess() {
        Expense expense = Expense.builder()
                .id(1L)
                .roomId(ROOM_ID)
                .payerUserId(TEST_USER_ID)
                .payerUserName("강산천")
                .title("상세 조회용 결제안")
                .totalAmount(10000)
                .inputType("MANUAL")
                .status("PENDING")
                .build();

        when(expenseRepository.findById(1L)).thenReturn(Optional.of(expense));

        ExpenseDetailResponse result = expenseService.getExpenseDetail(TEST_USER_ID, ROOM_ID, 1L);

        assertThat(result.getExpenseId()).isEqualTo(1L);
        verify(expenseValidator).validateRoomMember(ROOM_ID, TEST_USER_ID);
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
                .name("테스트 모임")
                .category("식비")
                .description("테스트 설명")
                .isProgress(false)
                .build();
        ReflectionTestUtils.setField(room, "id", roomId);
        return room;
    }
}
