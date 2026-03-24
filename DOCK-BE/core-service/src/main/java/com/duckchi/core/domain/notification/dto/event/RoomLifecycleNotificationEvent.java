package com.duckchi.core.domain.notification.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomLifecycleNotificationEvent {

    private String eventType; // ROOM_STARTED | ROOM_ENDED
    private Long roomId;
    private String roomName;

    private Long triggeredBy;
    private List<Long> recipientUserIds;

    private LocalDateTime occurredAt;
}