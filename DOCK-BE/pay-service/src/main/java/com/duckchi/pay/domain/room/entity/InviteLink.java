package com.duckchi.pay.domain.room.entity;

import com.duckchi.pay.domain.room.type.InviteLinkStatus;
import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "invite_links")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Access(AccessType.FIELD)
public class InviteLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "token", nullable = false, length = 64, unique = true)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Builder
    private InviteLink(
            Room room,
            String token,
            LocalDateTime expiresAt,
            int usedCount,
            boolean active,
            LocalDateTime createdAt
    ) {
        this.room = room;
        this.token = token;
        this.expiresAt = expiresAt;
        this.usedCount = usedCount;
        this.active = active;
        this.createdAt = createdAt;
    }

    public static InviteLink create(Room room, String token, LocalDateTime expiresAt) {
        return InviteLink.builder()
                .room(room)
                .token(token)
                .expiresAt(expiresAt)
                .usedCount(0)
                .active(true)
                .build();
    }

    public boolean isExpired(LocalDateTime now) {
        return !expiresAt.isAfter(now);
    }

    public InviteLinkStatus resolveStatus(LocalDateTime now) {
        if (!active) {
            return InviteLinkStatus.REVOKED;
        }
        if (isExpired(now)) {
            return InviteLinkStatus.EXPIRED;
        }
        return InviteLinkStatus.ACTIVE;
    }

    public void increaseUsedCount() {
        this.usedCount += 1;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
