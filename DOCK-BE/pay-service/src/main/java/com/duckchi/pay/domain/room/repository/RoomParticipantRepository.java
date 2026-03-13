package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    boolean existsByRoom_IdAndUserId(Long roomId, Long userId);
}
