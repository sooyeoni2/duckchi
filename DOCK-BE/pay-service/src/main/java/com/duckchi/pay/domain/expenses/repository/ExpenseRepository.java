package com.duckchi.pay.domain.expenses.repository;

import com.duckchi.pay.domain.expenses.entity.Expense;
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

    List<Expense> findAllByRoomId(Long roomId); // 특정 방의 모든 결제 내역 조회함.

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