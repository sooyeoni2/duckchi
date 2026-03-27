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
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE user_monthly_spends " +
                   "SET total_amount = total_amount + :amount, session_count = session_count + 1, last_updated_at = NOW() " +
                   "WHERE user_id = :userId AND spend_month = :spendMonth " +
                   "AND stat_type = :statType AND stat_value = :statValue", 
           nativeQuery = true)
    int updateAmountAtomic(
            @Param("userId") Long userId,
            @Param("spendMonth") String spendMonth,
            @Param("statType") String statType,
            @Param("statValue") String statValue,
            @Param("amount") Integer amount);

    /**
     * 방별 빈도 랭킹 조회 (AN-05).
     * session_count가 높은 순으로 정렬하여 해당 월 방별 정산 횟수를 반환함.
     */
    List<UserMonthlySpend> findAllByUserIdAndSpendMonthAndStatTypeOrderBySessionCountDesc(
            Long userId, String spendMonth, String statType);
}