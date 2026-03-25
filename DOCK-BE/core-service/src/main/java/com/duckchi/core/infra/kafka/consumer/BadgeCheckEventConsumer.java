package com.duckchi.core.infra.kafka.consumer;

import com.duckchi.core.domain.badge.dto.request.BadgeCheckRequest;
import com.duckchi.core.domain.badge.dto.response.BadgeCheckResponse;
import com.duckchi.core.domain.badge.dto.response.BadgeCheckResponse.NewlyAcquiredBadgeDto;
import com.duckchi.core.domain.badge.enums.BadgeEventType;
import com.duckchi.core.domain.badge.service.BadgeCheckService;
import com.duckchi.core.domain.notification.dto.event.BadgeCheckNotificationEvent;
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

/*
 * Kafka Consumer — 뱃지 조건 체크 이벤트 수신.
 *
 * Pay Service의 OutboxKafkaPublisher가 badge-check-event 토픽에 발행한 메시지를 수신하여:
 * 1. BadgeCheckServiceImpl.checkAndAwardBadges()로 뱃지 진행도 갱신
 * 2. 새로 획득한 뱃지가 있으면 해당 유저에게 FCM 푸시 알림 발송
 *
 * 기존 RoomLifecycleNotificationConsumer와 동일한 패턴으로 구현.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BadgeCheckEventConsumer {

    private final BadgeCheckService badgeCheckService;
    private final UserFcmTokenRepository userFcmTokenRepository;
    private final NotificationMessageService notificationMessageService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "badge-check-event",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(String payload, Acknowledgment ack) {
        BadgeCheckNotificationEvent event = deserialize(payload);
        log.info("[BadgeCheckConsumer] 뱃지 체크 이벤트 수신. userId={}, eventType={}",
                event.getUserId(), event.getEventType());

        try {
            // 1. 이벤트 데이터를 BadgeCheckRequest로 변환하여 뱃지 체크 서비스 호출
            BadgeCheckRequest request = BadgeCheckRequest.builder()
                    .userId(event.getUserId())
                    .eventType(BadgeEventType.valueOf(event.getEventType()))
                    .amount(event.getAmount())
                    .isAssassin(event.getIsAssassin())
                    .isTurtle(event.getIsTurtle())
                    .isNightOwl(event.getIsNightOwl())
                    .inviterId(event.getInviterId())
                    .category(event.getCategory())
                    .isNewCategory(event.getIsNewCategory())
                    .totalAccounts(event.getTotalAccounts())
                    .build();

            BadgeCheckResponse response = badgeCheckService.checkAndAwardBadges(request);

            // 2. 새로 획득한 뱃지가 있으면 FCM 푸시 알림 발송
            if (response.getNewlyAcquiredBadges() != null && !response.getNewlyAcquiredBadges().isEmpty()) {
                sendBadgeFcmNotifications(event.getUserId(), response.getNewlyAcquiredBadges());
            }

            ack.acknowledge();
            log.info("[BadgeCheckConsumer] 뱃지 체크 완료. userId={}, 신규획득={}건",
                    event.getUserId(),
                    response.getNewlyAcquiredBadges() != null ? response.getNewlyAcquiredBadges().size() : 0);

        } catch (Exception e) {
            log.error("[BadgeCheckConsumer] 뱃지 체크 이벤트 처리 실패. userId={}, eventType={}",
                    event.getUserId(), event.getEventType(), e);
            // 실패 시에도 ack를 하여 무한 재처리 방지 (Outbox 재시도 메커니즘에 의존)
            ack.acknowledge();
        }
    }

    /*
     * 새로 획득한 뱃지에 대해 해당 유저의 활성 FCM 토큰으로 푸시 알림을 발송한다.
     * 개별 토큰 전송 실패는 무시하고 다음 토큰으로 계속 진행한다.
     */
    private void sendBadgeFcmNotifications(Long userId, List<NewlyAcquiredBadgeDto> newlyAcquired) {
        List<UserFcmToken> tokens = userFcmTokenRepository
                .findAllByUserIdInAndIsActiveTrueAndNotificationEnabledTrue(List.of(userId));

        if (tokens.isEmpty()) {
            log.info("[BadgeCheckConsumer] FCM 토큰 없음, 푸시 생략. userId={}", userId);
            return;
        }

        for (NewlyAcquiredBadgeDto badge : newlyAcquired) {
            for (UserFcmToken token : tokens) {
                try {
                    notificationMessageService.sendBadgeAcquiredMessage(
                            token.getFcmToken(), badge.getName());
                } catch (Exception e) {
                    log.warn("[BadgeCheckConsumer] 뱃지 FCM 발송 실패. userId={}, badge={}, error={}",
                            userId, badge.getCode(), e.getMessage());
                }
            }
        }
    }

    private BadgeCheckNotificationEvent deserialize(String payload) {
        try {
            return objectMapper.readValue(payload, BadgeCheckNotificationEvent.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to deserialize badge check payload", e);
        }
    }
}
