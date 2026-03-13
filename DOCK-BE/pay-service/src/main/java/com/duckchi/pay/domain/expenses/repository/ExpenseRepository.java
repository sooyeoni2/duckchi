package com.duckchi.pay.domain.expenses.repository;

import com.duckchi.pay.domain.expenses.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * 결제 내역 레포지토리
 * JPA 기반의 데이터 액세스 계층임.
 */
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByRoomId(Long roomId); // 특정 방의 모든 결제 내역 조회함.
}
