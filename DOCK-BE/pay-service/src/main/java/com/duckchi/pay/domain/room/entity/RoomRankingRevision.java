package com.duckchi.pay.domain.room.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "room_ranking_revisions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RoomRankingRevision {

    @Id
    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "revision", nullable = false)
    private Long revision;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    private RoomRankingRevision(Long roomId, Long revision, LocalDateTime updatedAt) {
        this.roomId = roomId;
        this.revision = revision;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void onCreate() {
        if (revision == null) {
            revision = 0L;
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public long increaseRevision() {
        this.revision = this.revision == null ? 1L : this.revision + 1;
        this.updatedAt = LocalDateTime.now();
        return this.revision;
    }

    public static RoomRankingRevision initialize(Long roomId) {
        return RoomRankingRevision.builder()
                .roomId(roomId)
                .revision(0L)
                .build();
    }
}
