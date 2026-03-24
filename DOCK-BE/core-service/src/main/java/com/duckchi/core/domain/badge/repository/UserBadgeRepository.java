package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    // userId로 획득한 뱃지 목록 조회
    List<UserBadge> findAllByUserId(Long userId);

    // userId, badgeId로 획득 여부 확인
    Optional<UserBadge> findByUserIdAndBadgeId(Long userId, Long badgeId);
}
