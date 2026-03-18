package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomSession;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 모임 회차 레포지토리.
 */
public interface RoomSessionRepository extends JpaRepository<RoomSession, Long> {
}
