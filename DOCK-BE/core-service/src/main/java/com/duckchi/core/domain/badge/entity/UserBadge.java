package com.duckchi.core.domain.badge.entity;

import com.duckchi.core.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자별 뱃지 획득 이력 엔티티.
 * user_badges 테이블에 매핑되며, (user_id, badge_id) 복합 유니크 키로 중복 획득을 방지한다.
 *
 * [BADGE-04] 읽음 처리를 위해 is_read 필드를 추가.
 * SQL 스키마에는 is_read 컬럼이 없으므로, DDL 마이그레이션이 필요할 수 있다.
 * → ALTER TABLE user_badges ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
 */
@Entity
@Table(name = "user_badges", uniqueConstraints = {
        @UniqueConstraint(name = "UK_USER_BADGES", columnNames = {"user_id", "badge_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 뱃지를 획득한 사용자
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // 획득한 뱃지 정의
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    // 획득 일시 (INSERT 시 자동 생성)
    @CreationTimestamp
    @Column(name = "acquired_at", nullable = false, updatable = false)
    private LocalDateTime acquiredAt;

    // [BADGE-04] 알림 읽음 여부. 뱃지 획득 시 false, 사용자가 확인하면 true로 변경.
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    /**
     * [BADGE-04] 뱃지 획득 알림을 읽음 처리한다.
     * 이미 읽음 상태인 경우 호출해도 상태가 변하지 않는다.
     */
    public void markAsRead() {
        this.isRead = true;
    }

    /**
     * 읽음 상태인지 확인한다.
     */
    public boolean isAlreadyRead() {
        return this.isRead;
    }
}
