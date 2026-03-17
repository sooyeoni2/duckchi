package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomParticipant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    boolean existsByRoom_IdAndUserId(Long roomId, Long userId);

    Optional<RoomParticipant> findByRoom_IdAndUserId(Long roomId, Long userId);
}
