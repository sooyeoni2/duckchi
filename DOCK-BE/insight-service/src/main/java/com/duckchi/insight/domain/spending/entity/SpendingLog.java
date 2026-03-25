package com.duckchi.insight.domain.spending.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

/**
 * 개별 모임 회차 종료 시 기록되는 지출 로그 엔티티.
 */
@Entity
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(
        name = "spending_logs",
        indexes = {
                @Index(name = "IDX_LOGS_USER_ROOM_DATE", columnList = "user_id, room_id, recorded_at")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_LOGS_USER_SESSION", columnNames = {"user_id", "room_session_id"})
        }
)
public class SpendingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "room_session_id", nullable = false)
    private Long roomSessionId;

    @Column(name = "room_name", nullable = false, length = 100)
    private String roomName;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;
}