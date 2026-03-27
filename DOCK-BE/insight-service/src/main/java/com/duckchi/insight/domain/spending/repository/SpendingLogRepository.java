package com.duckchi.insight.domain.spending.repository;

import com.duckchi.insight.domain.spending.entity.SpendingLog;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpendingLogRepository extends JpaRepository<SpendingLog, Long> {
    Optional<SpendingLog> findFirstByUserIdAndRoomIdOrderByRecordedAtDesc(Long userId, Long roomId);

    /**
     * N+1 문제 해결을 위한 Batch Fetching 커스텀 쿼리.
     * 여러 roomId 리스트를 받아, 각 방의 가장 최근(MAX recordedAt) 로그에 기록된 방 이름을 한 번에 조회함.
     */
    @Query("SELECT s.roomId, s.roomName FROM SpendingLog s " +
           "WHERE s.userId = :userId AND s.roomId IN :roomIds " +
           "AND s.recordedAt = (SELECT MAX(s2.recordedAt) FROM SpendingLog s2 " +
           "WHERE s2.userId = :userId AND s2.roomId = s.roomId)")
    List<Object[]> findLatestRoomNamesByRoomIds(@Param("userId") Long userId, @Param("roomIds") List<Long> roomIds);
}