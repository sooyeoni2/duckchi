package com.duckchi.core.domain.badge.entity;

import com.duckchi.core.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/*
 * 사용자별 뱃지 진행도 엔티티.
 * badge_progress 테이블에 매핑되며, (user_id, badge_id) 복합 유니크 키로 관리한다.
 * 뱃지 조건 체크(BADGE-02) 시 current_count를 갱신하고,
 * required_count에 도달하면 user_badges에 획득 이력을 추가한다.
 */
@Entity
@Table(name = "badge_progress", uniqueConstraints = {
        @UniqueConstraint(name = "UK_BADGE_PROGRESS", columnNames = {"user_id", "badge_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BadgeProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 진행도의 대상 사용자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 진행도의 대상 뱃지 정의
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    // 현재 달성 횟수
    @Builder.Default
    @Column(name = "current_count", nullable = false, columnDefinition = "TINYINT")
    private Integer currentCount = 0;

    // 마지막 업데이트 일시 (ON UPDATE CURRENT_TIMESTAMP 자동 갱신)
    @UpdateTimestamp
    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt;

    /*
     * 진행도를 특정 값으로 설정한다.
     * @param count 새로운 달성 횟수
     */
    public void updateProgress(int count) {
        this.currentCount = count;
    }

    /*
     * 진행도를 1 증가시킨다.
     */
    public void incrementProgress() {
        this.currentCount++;
    }
}
