package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.projection.RoomParticipantUserProjection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    boolean existsByRoom_IdAndUserId(Long roomId, Long userId);

    Optional<RoomParticipant> findByRoom_IdAndUserId(Long roomId, Long userId);

    @Query("""
            select rp.room.id as roomId, rp.userId as userId
            from RoomParticipant rp
            where rp.room.id in :roomIds
            """)
    List<RoomParticipantUserProjection> findParticipantUserMappingsByRoomIds(@Param("roomIds") List<Long> roomIds);
}