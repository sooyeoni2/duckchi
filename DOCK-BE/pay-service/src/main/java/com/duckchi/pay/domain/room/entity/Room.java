package com.duckchi.pay.domain.room.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rooms")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "is_progress", nullable = false)
    private boolean isProgress;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    private Room(String name, String category, String description, boolean isProgress) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.isProgress = isProgress;
    }

    public void markInProgress() {
        this.isProgress = true;
    }

    public void markReady() {
        this.isProgress = false;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        // 엔티티 기본값을 보장해 서비스나 컴파일 경로(배치/테스트 환경)에서도 DDL 기본값과 동일한 결과를 유지한다.
        if (category == null || category.isBlank()) {
            category = "기타";
        }
        // 기본값: 모임 대기 상태 (진행 중 아님)
        if (!isProgress) {
            isProgress = false;
        }
    }

    public void updateRoomInfo(String name, String category) {
        if (name != null) {
            this.name = name.trim();
        }
        if (category != null) {
            this.category = category.isBlank() ? "기타" : category.trim();
        }
    }

    public void updateRoomDetails(String category, String description) {
        if (category != null && !category.isBlank()) {
            this.category = category.trim();
        }
        this.description = description; // 세부 내용은 null이나 빈 값이어도 덮어쓰기 허용 (UI에서 지울 수 있으므로)
    }

    public void deleteRoom() {
        this.deletedAt = LocalDateTime.now();
    }
}
