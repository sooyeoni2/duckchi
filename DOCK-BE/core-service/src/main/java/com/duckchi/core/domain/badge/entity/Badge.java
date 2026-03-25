package com.duckchi.core.domain.badge.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * 뱃지 마스터 정의 엔티티.
 * badges 테이블에 10종의 뱃지 정의가 저장된다.
 * deleted_at IS NULL 조건으로 Soft Delete 된 뱃지는 조회에서 자동 제외.
 */
@Entity
@Table(name = "badges")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@SQLRestriction("deleted_at IS NULL")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "TINYINT")
    private Integer id;

    // 뱃지 고유 코드 (ex: NOBLE_DUCK, ASSASSIN_DUCK 등)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    // 뱃지 표시 이름 (ex: 귀족 덕치, 칼입금 암살자 등)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    // 달성 조건 설명 텍스트
    @Column(name = "description", nullable = false)
    private String description;

    // 뱃지 이미지 URL (AWS S3 등)
    @Column(name = "image_url", length = 512)
    private String imageUrl;

    // 목표 달성 횟수 (ex: 10회, 3회, 100만원 등)
    @Column(name = "required_count", nullable = false, columnDefinition = "TINYINT")
    private Integer requiredCount;

    // Soft Delete 일시
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
