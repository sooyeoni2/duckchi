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

    @Column(name = "pay_password_fail_cnt",nullable = false)
    @Builder.Default
    private Integer payPasswordFailCnt = 0;

    //결제 비밀번호 설정
    public void updatePayPassword(String payPassword) {
        this.payPassword = payPassword;
    }
    //결제 비밀번호 설정되었는지 확인
    public boolean hasPayPassword() {
        return this.payPassword != null && !this.payPassword.isBlank();
    }

    //결제 비밀번호 실패 횟수 증가
    public void increasePayPasswordFailCnt(){
        this.payPasswordFailCnt++;
    }
    //결제 비밀번호 실패 횟수 초기화
    public void resetPayPasswordFailCnt(){
        this.payPasswordFailCnt = 0;
    }

    public void updateProfile(String name, String profileImageUrl) {
        this.name = name;
        this.profileImageUrl = profileImageUrl;
    }

}
