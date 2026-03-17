package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    boolean existsByRoom_IdAndUserId(Long roomId, Long userId);

    /**
     * 특정 방의 참여 유저 ID 리스트를 조회함.
     */
    @Query(value = "SELECT user_id FROM room_participants WHERE room_id = :roomId", nativeQuery = true)
    List<Long> findUserIdsByRoomId(@Param("roomId") Long roomId);
}
