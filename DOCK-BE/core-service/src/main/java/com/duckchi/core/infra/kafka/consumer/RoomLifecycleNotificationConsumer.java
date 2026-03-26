package com.duckchi.core.infra.kafka.consumer;

import com.duckchi.core.domain.notification.dto.event.RoomLifecycleNotificationEvent;
import com.duckchi.core.domain.notification.entity.UserFcmToken;
import com.duckchi.core.domain.notification.repository.UserFcmTokenRepository;
import com.duckchi.core.domain.notification.service.NotificationMessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomLifecycleNotificationConsumer {

    private static final String ROOM_STARTED = "ROOM_STARTED";
    private static final String ROOM_ENDED = "ROOM_ENDED";

    private final UserFcmTokenRepository userFcmTokenRepository;
    private final NotificationMessageService notificationMessageService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "room-lifecycle-notification-event",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(String payload, Acknowledgment ack) {
        RoomLifecycleNotificationEvent event = deserialize(payload);
        log.info("모임 알림 이벤트 수신 . roomId={}, eventType={}",
                event.getRoomId(), event.getEventType());

        try {
            List<Long> recipientUserIds = event.getRecipientUserIds();
            if (recipientUserIds == null || recipientUserIds.isEmpty()) {
                ack.acknowledge();
                return;
            }

            List<UserFcmToken> tokens = userFcmTokenRepository
                    .findAllByUserIdInAndIsActiveTrueAndNotificationEnabledTrue(recipientUserIds);

            for (UserFcmToken token : tokens) {
                try {
                    sendByEventType(event, token.getFcmToken());
                } catch (Exception e) {
                    log.error("알림 발송 실패. userId={}, roomId={}, eventType={}",
                            token.getUserId(), event.getRoomId(), event.getEventType(), e);
                }
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("모임 알림 이벤트 처리 실패. roomId={}, eventType={}",
                    event.getRoomId(), event.getEventType(), e);
        }
    }

    private void sendByEventType(RoomLifecycleNotificationEvent event, String token) {
        if (ROOM_STARTED.equals(event.getEventType())) {
            notificationMessageService.sendRoomStartedMessage(token, event.getRoomName(),event.getRoomId());
            return;
        }

        if (ROOM_ENDED.equals(event.getEventType())) {
            notificationMessageService.sendRoomEndedMessage(token, event.getRoomName(),event.getRoomId());
            return;
        }

    }

    private RoomLifecycleNotificationEvent deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, RoomLifecycleNotificationEvent.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to deserialize room lifecycle payload", e);
        }
    }
}
