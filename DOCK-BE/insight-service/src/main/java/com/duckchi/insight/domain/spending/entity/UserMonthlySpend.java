package com.duckchi.insight.domain.spending.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * 월별/타입별 지출 통계 엔티티.
 * 실시간 누적 업데이트(A방식)에 사용됨.
 */
@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(
        name = "user_monthly_spends",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_USER_MONTHLY_STAT", columnNames = {"user_id", "spend_month", "stat_type", "stat_value"})
        }
)
public class UserMonthlySpend {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "spend_month", nullable = false, length = 7)
    private String spendMonth; // 예: "2024-03"

    @Column(name = "stat_type", nullable = false, length = 20)
    private String statType; // TOTAL, CATEGORY, ROOM

    @Column(name = "stat_value", nullable = false, length = 50)
    private String statValue; // ALL, 카테고리명, 방ID 등

    @Builder.Default
    @Column(name = "total_amount", nullable = false)
    private Integer totalAmount = 0;

    @UpdateTimestamp
    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt;

    /**
     * 누적 금액 업데이트 메서드.
     */
    public void addAmount(Integer amount) {
        this.totalAmount += amount;
    }
}