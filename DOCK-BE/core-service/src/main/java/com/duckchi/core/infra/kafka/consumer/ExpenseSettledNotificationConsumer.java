package com.duckchi.core.infra.kafka.consumer;

import com.duckchi.core.domain.notification.dto.event.ExpenseSettledNotificationEvent;
import com.duckchi.core.domain.notification.dto.event.RoomLifecycleNotificationEvent;
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
@RequiredArgsConstructor
@Component
public class ExpenseSettledNotificationConsumer {

    private final UserFcmTokenRepository userFcmTokenRepository;
    private final NotificationMessageService notificationMessageService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics="expense-settled-notification-event",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(String payload, Acknowledgment ack) {
        ExpenseSettledNotificationEvent event = deserialize(payload);
        log.info("모임 알림 이벤트 수신 . expenseId={}",
                event.getExpenseId());

        try {
            Long payerUserId = event.getPayerUserId();
            if (payerUserId == null ) {
                ack.acknowledge();
                return;
            }

            List<UserFcmToken> tokens = userFcmTokenRepository
                    .findAllByUserIdAndIsActiveTrueAndNotificationEnabledTrue(payerUserId);

            for (UserFcmToken token : tokens) {
                try {
                    notificationMessageService.sendExpenseSettledMessage(token.getFcmToken(), event.getExpenseTitle());
                } catch (Exception e) {
                    log.error("알림 발송 실패. userId={}, expenseId={}",
                            token.getUserId(), event.getExpenseId(), e);
                }
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("모임 알림 이벤트 처리 실패. roomId={}",
                    event.getExpenseId(), e);
        }
    }



    private ExpenseSettledNotificationEvent deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, ExpenseSettledNotificationEvent.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to deserialize expense settled event payload", e);
        }
    }

}
