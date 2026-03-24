package com.duckchi.core.domain.badge.repository;

import com.duckchi.core.domain.badge.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 뱃지 마스터 정의 리포지토리.
 * 뱃지 코드(code)로 조회하는 메서드를 제공한다.
 */
public interface BadgeRepository extends JpaRepository<Badge, Integer> {

    // 뱃지 코드로 단건 조회 (ex: "NOBLE_DUCK")
    Optional<Badge> findByCode(String code);
}
