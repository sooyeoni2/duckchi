package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;

public interface RoomService {

    CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request);

    void updateRoomInfo(Long roomId, Long currentUserId, com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest request);
}
