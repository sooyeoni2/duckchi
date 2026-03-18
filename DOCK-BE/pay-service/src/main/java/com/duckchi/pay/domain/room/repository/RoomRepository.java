package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.repository.projection.RoomSettlementSummaryProjection;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :roomId")
    Optional<Room> findByIdForUpdate(@Param("roomId") Long roomId);

    @Query("""
            select distinct r
            from RoomParticipant rp
            join rp.room r
            where rp.userId = :userId
              and r.deletedAt is null
              and (:isProgress is null or r.isProgress = :isProgress)
            order by r.createdAt desc
            """)
    List<Room> findParticipatingRooms(@Param("userId") Long userId, @Param("isProgress") Boolean isProgress);

    @Query(value = """
            select s.room_id as roomId,
                   cast(sum(case when s.status = 'COMPLETED' then 1 else 0 end) as signed) as completedCount,
                   cast(sum(case when s.status in ('PENDING', 'COMPLETED') then 1 else 0 end) as signed) as targetCount
            from settlements s
            where s.room_id in (:roomIds)
            group by s.room_id
            """, nativeQuery = true)
    List<RoomSettlementSummaryProjection> findRoomSettlementSummaries(@Param("roomIds") List<Long> roomIds);
}