package com.duckchi.pay.domain.room.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 모임 회차 엔티티 (Room Session).
 * 한 모임방 내에서 발생하는 개별 정산 회차를 관리함.
 */
@Entity
@Table(name = "room_sessions")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class RoomSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "final_category", length = 50)
    private String finalCategory;

    @Builder
    private RoomSession(Room room) {
        this.room = room;
    }

    @PrePersist
    void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
    }

    public void endSession(String finalCategory) {
        this.endedAt = LocalDateTime.now();
        this.finalCategory = finalCategory;
    }
}
