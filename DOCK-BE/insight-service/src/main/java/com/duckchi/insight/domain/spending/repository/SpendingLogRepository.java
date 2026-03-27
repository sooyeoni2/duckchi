package com.duckchi.insight.domain.spending.repository;

import com.duckchi.insight.domain.spending.entity.SpendingLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpendingLogRepository extends JpaRepository<SpendingLog, Long> {

    /**
     * 성능 개선: 상관 서브쿼리(Correlated Subquery) → GROUP BY 기반 파생 테이블 조인.
     *
     * [기존] 각 행마다 MAX(recordedAt) 서브쿼리를 반복 실행 → O(n²) 성능 저하 우려
     * [변경] GROUP BY로 최신시각을 먼저 집계한 후 JOIN → 단 2번의 스캔으로 처리
     *
     * 여러 roomId 리스트를 받아, 각 방의 가장 최근 로그에 기록된 방 이름을 한 번에 조회함.
     */
    @Query(value =
            "SELECT s.room_id, s.room_name " +
            "FROM spending_logs s " +
            "INNER JOIN ( " +
            "    SELECT room_id, MAX(recorded_at) AS max_at " +
            "    FROM spending_logs " +
            "    WHERE user_id = :userId AND room_id IN :roomIds " +
            "    GROUP BY room_id " +
            ") latest ON s.room_id = latest.room_id AND s.recorded_at = latest.max_at " +
            "WHERE s.user_id = :userId",
            nativeQuery = true)
    List<Object[]> findLatestRoomNamesByRoomIds(@Param("userId") Long userId, @Param("roomIds") List<Long> roomIds);
}