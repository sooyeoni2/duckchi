package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.Expense;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 결제안 조회에 필요한 JPA 저장소이다.
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
}
