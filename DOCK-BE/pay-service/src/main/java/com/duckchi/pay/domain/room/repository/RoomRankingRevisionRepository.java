package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomRankingRevision;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRankingRevisionRepository extends JpaRepository<RoomRankingRevision, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RoomRankingRevision r where r.roomId = :roomId")
    Optional<RoomRankingRevision> findByRoomIdForUpdate(@Param("roomId") Long roomId);
}
