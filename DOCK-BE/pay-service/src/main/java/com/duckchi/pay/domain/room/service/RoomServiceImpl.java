package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;

import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomServiceImpl implements RoomService {

    private static final String DEFAULT_CATEGORY = "기타";

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    @Override
    @Transactional
    public CreateRoomResponse createRoom(Long currentUserId, CreateRoomRequest request) {
        // JWT 미연동 단계에서는 헤더 기반 사용자 식별을 강제해 비회원 방 생성을 막는다.
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = Room.builder()
                .name(request.getName().trim())
                .category(normalizeCategory(request.getCategory()))
                .description(request.getDescription())
                .isProgress(false)
                .build();

        Room savedRoom = roomRepository.save(room);

        RoomParticipant owner = RoomParticipant.builder()
                .room(savedRoom)
                .userId(currentUserId)
                // 방 생성자는 이후 ROOM-02/04 흐름의 기준 주체이므로 생성 시점에 관리자/동의 상태로 저장한다.
                .isAdmin(true)
                .isAgreed(true)
                .build();

        roomParticipantRepository.save(owner);

        return CreateRoomResponse.from(savedRoom);
    }

    private String normalizeCategory(String category) {
        // DDL 기본값("기타")과 서비스 동작을 맞춰 DB 기본값 의존 없이 동일 결과를 보장한다.
        if (category == null || category.isBlank()) {
            return DEFAULT_CATEGORY;
        }
        return category.trim();
    }

    @Override
    @Transactional
    public void updateRoomInfo(Long roomId, Long currentUserId, com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest request) {
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        RoomParticipant participant = roomParticipantRepository.findByRoom_IdAndUserId(roomId, currentUserId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_MEMBER_ONLY)); 

        if (!participant.isAdmin()) {
            throw new CustomException(ErrorCode.ROOM_NOT_ADMIN); // 별도의 커스텀 에러 혹은 403 반환
        }

        if (room.isProgress()) {
            throw new CustomException(ErrorCode.ROOM_CANNOT_UPDATE_STATUS); // 정산중일 때 수정 불가 에러
        }

        room.updateRoomInfo(request.getName(), request.getCategory());
    }
}