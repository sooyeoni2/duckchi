package com.duckchi.core.infra.kafka.consumer;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.core.domain.notification.dto.event.RoomLifecycleNotificationEvent;
import com.duckchi.core.domain.notification.entity.UserFcmToken;
import com.duckchi.core.domain.notification.repository.UserFcmTokenRepository;
import com.duckchi.core.domain.notification.service.NotificationMessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.support.Acknowledgment;

@ExtendWith(MockitoExtension.class)
class RoomLifecycleNotificationConsumerTest {

    @Mock
    private UserFcmTokenRepository userFcmTokenRepository;

    @Mock
    private NotificationMessageService notificationMessageService;

    @Mock
    private Acknowledgment acknowledgment;

    private RoomLifecycleNotificationConsumer consumer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        consumer = new RoomLifecycleNotificationConsumer(
                userFcmTokenRepository,
                notificationMessageService,
                objectMapper
        );
    }

    @Test
    void consume_whenRoomStartedEvent_sendsNotificationsAndAcknowledges() throws Exception {
        // given: 시작 이벤트와 활성 토큰 목록이 준비되어 있다.
        RoomLifecycleNotificationEvent event = RoomLifecycleNotificationEvent.builder()
                .eventType("ROOM_STARTED")
                .roomId(101L)
                .roomName("테스트 모임")
                .triggeredBy(7L)
                .recipientUserIds(List.of(7L, 8L))
                .build();
        String payload = objectMapper.writeValueAsString(event);

        List<UserFcmToken> tokens = List.of(
                createToken(1L, 7L, "token-1"),
                createToken(2L, 8L, "token-2")
        );
        when(userFcmTokenRepository.findAllByUserIdInAndIsActiveTrueAndNotificationEnabledTrue(List.of(7L, 8L)))
                .thenReturn(tokens);

        // when: consumer가 payload를 처리한다.
        consumer.consume(payload, acknowledgment);

        // then: 각 토큰으로 시작 알림을 보내고 ack 한다.
        verify(notificationMessageService).sendRoomStartedMessage("token-1", "테스트 모임");
        verify(notificationMessageService).sendRoomStartedMessage("token-2", "테스트 모임");
        verify(acknowledgment).acknowledge();
    }

    @Test
    void consume_whenRecipientListIsEmpty_acknowledgesWithoutSending() throws Exception {
        // given: 수신 대상이 없는 이벤트 payload가 준비되어 있다.
        RoomLifecycleNotificationEvent event = RoomLifecycleNotificationEvent.builder()
                .eventType("ROOM_STARTED")
                .roomId(101L)
                .roomName("테스트 모임")
                .recipientUserIds(List.of())
                .build();
        String payload = objectMapper.writeValueAsString(event);

        // when: consumer가 payload를 처리한다.
        consumer.consume(payload, acknowledgment);

        // then: 발송 없이 ack만 수행한다.
        verify(userFcmTokenRepository, never())
                .findAllByUserIdInAndIsActiveTrueAndNotificationEnabledTrue(List.of());
        verify(notificationMessageService, never()).sendRoomStartedMessage(anyString(), anyString());
        verify(acknowledgment).acknowledge();
    }

    @Test
    void consume_whenOneTokenFails_continuesRemainingTokensAndAcknowledges() throws Exception {
        // given: 종료 이벤트와 일부 토큰 발송 실패 상황이 준비되어 있다.
        RoomLifecycleNotificationEvent event = RoomLifecycleNotificationEvent.builder()
                .eventType("ROOM_ENDED")
                .roomId(101L)
                .roomName("테스트 모임")
                .recipientUserIds(List.of(7L, 8L))
                .build();
        String payload = objectMapper.writeValueAsString(event);

        List<UserFcmToken> tokens = List.of(
                createToken(1L, 7L, "token-1"),
                createToken(2L, 8L, "token-2")
        );
        when(userFcmTokenRepository.findAllByUserIdInAndIsActiveTrueAndNotificationEnabledTrue(List.of(7L, 8L)))
                .thenReturn(tokens);
        doThrow(new RuntimeException("FCM failed"))
                .when(notificationMessageService)
                .sendRoomEndedMessage("token-1", "테스트 모임");

        // when: consumer가 payload를 처리한다.
        consumer.consume(payload, acknowledgment);

        // then: 실패 토큰은 건너뛰고 다음 토큰까지 처리한 뒤 ack 한다.
        verify(notificationMessageService).sendRoomEndedMessage("token-1", "테스트 모임");
        verify(notificationMessageService).sendRoomEndedMessage("token-2", "테스트 모임");
        verify(acknowledgment).acknowledge();
    }

    private UserFcmToken createToken(Long id, Long userId, String fcmToken) {
        return UserFcmToken.builder()
                .id(id)
                .userId(userId)
                .deviceId("device-" + userId)
                .fcmToken(fcmToken)
                .notificationEnabled(true)
                .isActive(true)
                .build();
    }
}
