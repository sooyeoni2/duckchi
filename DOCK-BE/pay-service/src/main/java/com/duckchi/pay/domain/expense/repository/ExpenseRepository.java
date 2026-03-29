package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseTitleProjection;
import com.duckchi.pay.domain.expense.repository.projection.RoomRankingPayerAmountProjection;
import com.duckchi.pay.domain.room.repository.projection.RoomExpenseSummaryProjection;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 결제 내역 레포지토리
 * JPA 기반의 데이터 액세스 계층임.
 */
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /**
     * 특정 모임방의 결제안 전체를 최신순으로 조회한다.
     */
    List<Expense> findAllByRoomIdOrderByCreatedAtDesc(Long roomId);

    /**
     * 특정 모임방에서 특정 사용자가 생성한 결제안만 최신순으로 조회한다.
     */
    List<Expense> findAllByRoomIdAndPayerUserIdOrderByCreatedAtDesc(Long roomId, Long payerUserId);

    /**
     * SET-01 요청 시 동일 결제에 대한 동시 정산 요청 경쟁을 막기 위해 결제를 비관적 락으로 조회한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Expense e where e.id in :expenseIds")
    List<Expense> findAllByIdInForUpdate(@Param("expenseIds") List<Long> expenseIds);

    /**
     * SET-02 송금 완료 처리 시 결제 상태를 안전하게 전이하기 위해 결제 행을 비관적 락으로 조회한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Expense e where e.id = :expenseId")
    Optional<Expense> findByIdForUpdate(@Param("expenseId") Long expenseId);

    /**
     * 여러 모임방의 총 결제 금액과 결제안 개수를 방 단위로 집계한다.
     */
    @Query("""
            select e.roomId as roomId,
                   coalesce(sum(e.totalAmount), 0) as totalPay,
                   count(e.id) as payCount
            from Expense e
            where e.roomId in :roomIds
            group by e.roomId
            """)
    List<RoomExpenseSummaryProjection> findRoomExpenseSummaries(@Param("roomIds") List<Long> roomIds);

    /**
     * ROOM-12에서 현재 회차 기준 방 전체 결제 합계를 조회한다.
     */
    @Query("""
            select coalesce(sum(e.totalAmount), 0)
            from Expense e
            where e.roomId = :roomId
              and e.roomSessionId = :roomSessionId
            """)
    Long sumTotalAmountByRoomIdAndRoomSessionId(
            @Param("roomId") Long roomId,
            @Param("roomSessionId") Long roomSessionId
    );

    /**
     * ROOM-12에서 settlement와 연결된 결제 제목을 배치 조회한다.
     */
    @Query("""
            select e.id as expenseId, e.title as title
            from Expense e
            where e.id in :expenseIds
            """)
    List<ExpenseTitleProjection> findExpenseTitlesByIds(@Param("expenseIds") List<Long> expenseIds);

    /**
     * ROOM-13에서 roomId-결제 연관성을 함께 검증하기 위한 조회 메서드다.
     */
    Optional<Expense> findByIdAndRoomId(Long expenseId, Long roomId);

    long countByRoomIdAndStatus(Long roomId, String status);

    @Query("""
        select e.payerUserId as userId,
               coalesce(sum(e.totalAmount), 0) as amount
        from Expense e
        where e.roomId = :roomId
          and e.status = 'REQUESTED'
        group by e.payerUserId
        """)
    List<RoomRankingPayerAmountProjection> sumRequestedAmountByPayer(@Param("roomId") Long roomId);
}


