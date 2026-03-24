package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/*
 * 사용자별 뱃지 획득 이력 리포지토리.
 */
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    // 특정 사용자의 모든 획득 뱃지 조회
    List<UserBadge> findAllByUserId(Long userId);

    // 특정 사용자가 특정 뱃지를 이미 획득했는지 확인
    boolean existsByUserIdAndBadgeId(Long userId, Integer badgeId);

    // BADGE-04: 뱃지 ID + 사용자 ID로 단건 조회 (읽음 처리용)
    Optional<UserBadge> findByIdAndUserId(Long id, Long userId);
}
