package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.BadgeProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeProgressRepository extends JpaRepository<BadgeProgress, Long> {

    // userId로 진행도 목록 조회
    List<BadgeProgress> findAllByUserId(Long userId);

    // userId, badgeId로 진행도 조회
    Optional<BadgeProgress> findByUserIdAndBadgeId(Long userId, Long badgeId);
}
