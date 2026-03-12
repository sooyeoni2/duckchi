package com.duckchi.pay.domain.room.repository;

import com.duckchi.pay.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
