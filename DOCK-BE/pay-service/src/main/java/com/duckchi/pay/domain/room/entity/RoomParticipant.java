package com.duckchi.pay.domain.room.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "room_participants",
        uniqueConstraints = @UniqueConstraint(name = "UK_ROOM_PARTICIPANTS", columnNames = {"room_id", "user_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin;

    @Column(name = "is_agreed", nullable = false)
    private boolean isAgreed;

    @Builder
    private RoomParticipant(Room room, Long userId, boolean isAdmin, boolean isAgreed) {
        this.room = room;
        this.userId = userId;
        this.isAdmin = isAdmin;
        this.isAgreed = isAgreed;
    }
}
