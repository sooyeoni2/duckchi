package com.duckchi.insight.domain.spending.repository;

import com.duckchi.insight.domain.spending.entity.UserMonthlySpend;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserMonthlySpendRepository extends JpaRepository<UserMonthlySpend, Long> {
    Optional<UserMonthlySpend> findByUserIdAndSpendMonthAndStatTypeAndStatValue(
            Long userId, String spendMonth, String statType, String statValue);

    // 최근 N개월 트렌드 조회를 위한 메서드
    List<UserMonthlySpend> findByUserIdAndStatTypeAndStatValueAndSpendMonthInOrderBySpendMonthAsc(
            Long userId, String statType, String statValue, List<String> spendMonths);

    List<UserMonthlySpend> findAllByUserIdAndSpendMonthAndStatTypeOrderByTotalAmountDesc(
            Long userId, String spendMonth, String statType);

    /**
     * Native Query를 이용한 원자적 업데이트 (동시성 제어 고도화).
     * DB 레벨에서 직접 더하기 연산을 수행하여 갱신 분실(Lost Update) 문제를 원천 차단함.
     */
    @Modifying
    @Query(value = "UPDATE user_monthly_spends " +
                   "SET total_amount = total_amount + :amount, last_updated_at = NOW() " +
                   "WHERE user_id = :userId AND spend_month = :spendMonth " +
                   "AND stat_type = :statType AND stat_value = :statValue", 
           nativeQuery = true)
    int updateAmountAtomic(
            @Param("userId") Long userId,
            @Param("spendMonth") String spendMonth,
            @Param("statType") String statType,
            @Param("statValue") String statValue,
            @Param("amount") Integer amount);
}