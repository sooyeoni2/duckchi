package com.duckchi.core.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "social_id", nullable = false, unique = true)
    private String socialId;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @Column(name = "tag", nullable = false, length = 20)
    private String tag;

    @Column(name = "profile_image_url", length = 512)
    private String profileImageUrl;

    @Column(name = "transfer_limit", nullable = false)
    @Builder.Default
    private Integer transferLimit = 0;

    @Column(name = "pay_password")
    private String payPassword;

    @Column(name = "ssafy_user_key", nullable = false, length = 100)
    private String ssafyUserKey;

    @Column(name = "rep_badge_id", columnDefinition = "TINYINT")
    private Integer repBadgeId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
