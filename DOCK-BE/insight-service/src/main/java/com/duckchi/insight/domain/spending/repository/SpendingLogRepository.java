package com.duckchi.insight.domain.spending.repository;

import com.duckchi.insight.domain.spending.entity.SpendingLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpendingLogRepository extends JpaRepository<SpendingLog, Long> {
    Optional<SpendingLog> findFirstByUserIdAndRoomIdOrderByRecordedAtDesc(Long userId, Long roomId);
}
