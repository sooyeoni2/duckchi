package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.RoomSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomSessionRepository extends JpaRepository<RoomSession, Long> {
    
    // 특정 방의 진행 중인(종료되지 않은) 세션을 조회한다.
    Optional<RoomSession> findByRoom_IdAndEndedAtIsNull(Long roomId);
}
