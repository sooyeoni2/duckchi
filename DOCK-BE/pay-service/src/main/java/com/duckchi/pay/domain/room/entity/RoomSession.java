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

    @Column(nullable = false)
    private Long roomId;             // 소속된 모임방 식별자임.

    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt; // 회차 시작 일시임.

    private LocalDateTime endedAt;   // 회차 종료(정산 완료) 일시임.

    @Column(length = 50)
    private String finalCategory;    // 종료 시점의 최종 카테고리임.

    @PrePersist
    protected void onCreate() {
        this.startedAt = LocalDateTime.now();
    }
}
