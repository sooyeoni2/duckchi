package com.duckchi.insight.domain.spending.repository;

import com.duckchi.insight.domain.spending.entity.UserMonthlySpend;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserMonthlySpendRepository extends JpaRepository<UserMonthlySpend, Long> {
    Optional<UserMonthlySpend> findByUserIdAndSpendMonthAndStatTypeAndStatValue(
            Long userId, String spendMonth, String statType, String statValue);

    // 최근 N개월 트렌드 조회를 위한 메서드
    List<UserMonthlySpend> findByUserIdAndStatTypeAndStatValueAndSpendMonthInOrderBySpendMonthAsc(
            Long userId, String statType, String statValue, List<String> spendMonths);

    List<UserMonthlySpend> findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(
            Long userId, String spendMonth, String statType);
}