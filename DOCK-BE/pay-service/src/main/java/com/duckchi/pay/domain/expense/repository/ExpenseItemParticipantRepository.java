package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.ExpenseItemParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseItemParticipantRepository extends JpaRepository<ExpenseItemParticipant, Long> {

    /**
     * ROOM-13 OCR 상세 응답 조립을 위해 결제 기준 품목 참여자 목록을 품목 정보와 함께 조회한다.
     */
    @Query("""
            select eip
            from ExpenseItemParticipant eip
            join fetch eip.expenseItem ei
            where ei.expense.id = :expenseId
            order by eip.userId asc, ei.id asc, eip.id asc
            """)
    List<ExpenseItemParticipant> findByExpenseIdWithExpenseItem(@Param("expenseId") Long expenseId);
}
