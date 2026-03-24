package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.BadgeProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 사용자별 뱃지 진행도 리포지토리.
 */
public interface BadgeProgressRepository extends JpaRepository<BadgeProgress, Long> {

    // 특정 사용자의 모든 뱃지 진행도 조회
    List<BadgeProgress> findAllByUserId(Long userId);

    // 특정 사용자 + 뱃지 코드로 진행도 단건 조회 (BADGE-03)
    Optional<BadgeProgress> findByUserIdAndBadgeCode(Long userId, String badgeCode);

    // 특정 사용자 + 뱃지 ID로 진행도 단건 조회
    Optional<BadgeProgress> findByUserIdAndBadgeId(Long userId, Integer badgeId);
}
