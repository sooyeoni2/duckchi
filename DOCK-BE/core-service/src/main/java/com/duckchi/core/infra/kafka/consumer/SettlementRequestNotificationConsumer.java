package com.duckchi.core.infra.kafka.consumer;

import com.duckchi.core.domain.notification.dto.event.SettlementRequestNotificationEvent;
import com.duckchi.core.domain.notification.entity.UserFcmToken;
import com.duckchi.core.domain.notification.repository.UserFcmTokenRepository;
import com.duckchi.core.domain.notification.service.NotificationMessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementRequestNotificationConsumer {

    private final NotificationMessageService notificationMessageService;
    private final ObjectMapper objectMapper;
    private final UserFcmTokenRepository userFcmTokenRepository;

    @KafkaListener(
            topics = "settlement-request-notification-event",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(String payload, Acknowledgment ack){
        SettlementRequestNotificationEvent event = deserialize(payload);
        log.info("정산 요청 이벤트 수신. receiverId={}",
                event.getReceiverId());

        try {
            List<UserFcmToken> tokens = userFcmTokenRepository
                    .findAllByUserIdAndIsActiveTrueAndNotificationEnabledTrue(event.getReceiverId());

            for (UserFcmToken token : tokens) {
                try {
                    sendByIsAgreed(event, token.getFcmToken());
                } catch (Exception e) {
                    log.error("알림 발송 실패. userId={}, receiverId={}",
                            token.getUserId(), event.getReceiverId(), e);
                }
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("정산 요청 이벤트 처리 실패. receiverId={}",
                    event.getReceiverId(), e);
        }
    }

    private void sendByIsAgreed(SettlementRequestNotificationEvent event, String token){
        if(event.isAgreed()) {
            notificationMessageService.sendSettlementRequestAutoMessage(token,event);
            return;
        }

        notificationMessageService.sendSettlementRequestOneclickMessage(token,event);
    }

    private SettlementRequestNotificationEvent deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, SettlementRequestNotificationEvent.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to deserialize settlementRequest payload", e);
        }
    }
}

