package com.duckchi.pay.domain.room.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/*
Kafka payload DTO
외부로 보낼 최종 메시지
* */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomLifecycleNotificationEvent {

    private String eventType;          // ROOM_STARTED | ROOM_ENDED
    private Long roomId;
    private String roomName;

    private Long triggeredBy;    // 시작/종료를 누른 사용자
    private List<Long> recipientUserIds; // 알림 대상자들

    private LocalDateTime occurredAt;  // 실제 시작/종료 처리 시각
}