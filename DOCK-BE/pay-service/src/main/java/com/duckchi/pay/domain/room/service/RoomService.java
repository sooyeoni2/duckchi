package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;

public interface RoomService {

    CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request);
}
