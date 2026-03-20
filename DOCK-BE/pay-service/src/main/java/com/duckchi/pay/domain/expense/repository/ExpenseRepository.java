package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.Expense;
import com.duckchi.pay.domain.room.repository.projection.RoomExpenseSummaryProjection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByRoomIdAndStatus(Long roomId, String status);
}