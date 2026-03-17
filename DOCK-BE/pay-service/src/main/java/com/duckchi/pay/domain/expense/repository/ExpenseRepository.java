package com.duckchi.pay.domain.expense.repository;

import com.duckchi.pay.domain.expense.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * 결제 내역 레포지토리
 * JPA 기반의 데이터 액세스 계층임.
 */
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    /**
     * 특정 모임방의 모든 결제 내역을 최신 등록순으로 조회함.
     */
    List<Expense> findAllByRoomIdOrderByCreatedAtDesc(Long roomId);
}
