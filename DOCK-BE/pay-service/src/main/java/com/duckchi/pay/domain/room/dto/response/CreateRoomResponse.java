package com.duckchi.pay.domain.room.dto.response;

import com.duckchi.pay.domain.room.entity.Room;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateRoomResponse {

    private Long roomId;
    private String name;
    private String category;
    private String status;
    private LocalDateTime createdAt;

    public static CreateRoomResponse from(Room room) {
        return CreateRoomResponse.builder()
                .roomId(room.getId())
                .name(room.getName())
                .category(room.getCategory())
                .status(room.getStatus().name())
                .createdAt(room.getCreatedAt())
                .build();
    }
}
