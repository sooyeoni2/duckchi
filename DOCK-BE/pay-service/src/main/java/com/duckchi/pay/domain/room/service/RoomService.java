package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.DelegateAdminRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import java.util.List;

public interface RoomService {

    CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request);

    UpdateAutoDebitConsentResponse updateAutoDebitConsent(
            Long roomId,
            Long currentUserId,
            AutoDebitConsentStatus status
    );

    UpdateAutoDebitConsentResponse toggleAutoDebitConsent(
            Long roomId,
            Long currentUserId
    );

    List<RoomListResponse> getRoomLists(Long currentUserId, Boolean isProgress);

    void updateRoomInfo(Long roomId, Long currentUserId, UpdateRoomRequest request);

    void leaveRoom(Long roomId, Long currentUserId);

    void deleteRoom(Long roomId, Long currentUserId);

    void startRoom(Long roomId, Long currentUserId, com.duckchi.pay.domain.room.dto.request.StartRoomRequest request);

    void endRoom(Long roomId, Long currentUserId);

    void delegateAdmin(Long roomId, Long currentUserId, DelegateAdminRequest request);
}
