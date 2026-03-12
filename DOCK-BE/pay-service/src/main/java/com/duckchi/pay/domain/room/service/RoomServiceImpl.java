package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.entity.Room;
import com.duckchi.pay.domain.room.entity.RoomParticipant;
import com.duckchi.pay.domain.room.repository.RoomParticipantRepository;
import com.duckchi.pay.domain.room.repository.RoomRepository;
import com.duckchi.pay.domain.room.type.RoomStatus;
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
        if (currentUserId == null) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }

        Room room = Room.builder()
                .name(request.getName().trim())
                .category(normalizeCategory(request.getCategory()))
                .description(request.getDescription())
                .status(RoomStatus.READY)
                .build();

        Room savedRoom = roomRepository.save(room);

        RoomParticipant owner = RoomParticipant.builder()
                .room(savedRoom)
                .userId(currentUserId)
                .isAdmin(true)
                .isAgreed(true)
                .build();

        roomParticipantRepository.save(owner);

        return CreateRoomResponse.from(savedRoom);
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return DEFAULT_CATEGORY;
        }
        return category.trim();
    }
}
