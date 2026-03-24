package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BadgeRepository extends JpaRepository<Badge, Long> {

    // 삭제되지 않은 전체 뱃지 목록 조회
    List<Badge> findAllByDeletedAtIsNull();
}
