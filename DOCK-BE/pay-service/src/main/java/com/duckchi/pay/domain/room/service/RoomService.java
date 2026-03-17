package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;

public interface RoomService {

    CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request);

    UpdateAutoDebitConsentResponse updateAutoDebitConsent(
            Long roomId,
            Long currentUserId,
            AutoDebitConsentStatus status
    );

    void updateRoomInfo(Long roomId, Long currentUserId, com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest request);

    void leaveRoom(Long roomId, Long currentUserId);

    void deleteRoom(Long roomId, Long currentUserId);
}
