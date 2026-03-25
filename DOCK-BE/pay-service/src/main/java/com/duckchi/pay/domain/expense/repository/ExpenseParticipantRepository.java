package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.ExpenseParticipant;
import com.duckchi.pay.domain.expense.repository.projection.ExpenseParticipantCountProjection;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseParticipantRepository extends JpaRepository<ExpenseParticipant, Long> {

    /**
     * SET-01 정산 요청 시점의 금액 정합성을 보장하기 위해,
     * 참여자 행을 비관적 락으로 조회해 동일 트랜잭션 스냅샷을 고정한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select ep
            from ExpenseParticipant ep
            where ep.expense.id in :expenseIds
            order by ep.expense.id asc, ep.id asc
            """)
    List<ExpenseParticipant> findByExpense_IdInForUpdate(@Param("expenseIds") List<Long> expenseIds);

    /**
     * ROOM-13 정산 현황 조립을 위해 결제 참여자 목록을 고정 순서로 조회한다.
     */
    List<ExpenseParticipant> findByExpense_IdOrderByIdAsc(Long expenseId);

    /**
     * ROOM-12에서 결제별 참여 인원 수를 배치 집계한다.
     */
    @Query("""
            select ep.expense.id as expenseId, count(ep.id) as participantCount
            from ExpenseParticipant ep
            where ep.expense.id in :expenseIds
            group by ep.expense.id
            """)
    List<ExpenseParticipantCountProjection> countParticipantsByExpenseIds(@Param("expenseIds") List<Long> expenseIds);

    /**
     * 회차 종료 시 인사이트 서비스로 전송할 사용자별 총 지출 합계액을 조회한다.
     */
    @Query("""
            select ep.userId, sum(ep.splitAmount)
            from ExpenseParticipant ep
            where ep.expense.roomSessionId = :roomSessionId
            group by ep.userId
            """)
    List<Object[]> findTotalSpendPerUserBySessionId(@Param("roomSessionId") Long roomSessionId);
}


