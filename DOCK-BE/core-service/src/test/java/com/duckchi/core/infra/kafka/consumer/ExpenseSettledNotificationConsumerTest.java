package com.duckchi.core.infra.kafka.consumer;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.duckchi.core.domain.notification.dto.event.ExpenseSettledNotificationEvent;
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
class ExpenseSettledNotificationConsumerTest {

    @Mock
    private UserFcmTokenRepository userFcmTokenRepository;

    @Mock
    private NotificationMessageService notificationMessageService;

    @Mock
    private Acknowledgment acknowledgment;

    private ExpenseSettledNotificationConsumer consumer;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        consumer = new ExpenseSettledNotificationConsumer(
                userFcmTokenRepository,
                notificationMessageService,
                objectMapper
        );
    }

    @Test
    void consume_whenExpenseSettledEventArrives_sendsNotificationsAndAcknowledges() throws Exception {
        // given: 정산 완료 이벤트와 활성 토큰들이 준비되어 있다.
        ExpenseSettledNotificationEvent event = ExpenseSettledNotificationEvent.builder()
                .expenseId(301L)
                .expenseTitle("회식 정산")
                .payerUserId(7L)
                .build();
        String payload = objectMapper.writeValueAsString(event);

        List<UserFcmToken> tokens = List.of(
                createToken(1L, 7L, "token-1"),
                createToken(2L, 7L, "token-2")
        );
        when(userFcmTokenRepository.findAllByUserIdAndIsActiveTrueAndNotificationEnabledTrue(7L))
                .thenReturn(tokens);

        // when: consumer가 정산 완료 이벤트를 소비한다.
        consumer.consume(payload, acknowledgment);

        // then: 모든 활성 토큰에 알림을 보내고 ack 한다.
        verify(notificationMessageService).sendExpenseSettledMessage("token-1", "회식 정산");
        verify(notificationMessageService).sendExpenseSettledMessage("token-2", "회식 정산");
        verify(acknowledgment).acknowledge();
    }

    @Test
    void consume_whenPayerUserIdIsMissing_acknowledgesWithoutSending() throws Exception {
        // given: payer 정보가 없는 이벤트 payload가 들어온다.
        ExpenseSettledNotificationEvent event = ExpenseSettledNotificationEvent.builder()
                .expenseId(301L)
                .expenseTitle("회식 정산")
                .payerUserId(null)
                .build();
        String payload = objectMapper.writeValueAsString(event);

        // when: consumer가 이벤트를 소비한다.
        consumer.consume(payload, acknowledgment);

        // then: 토큰 조회와 알림 발송 없이 ack 한다.
        verify(userFcmTokenRepository, never())
                .findAllByUserIdAndIsActiveTrueAndNotificationEnabledTrue(7L);
        verify(notificationMessageService, never()).sendExpenseSettledMessage(anyString(), anyString());
        verify(acknowledgment).acknowledge();
    }

    @Test
    void consume_whenOneTokenFails_continuesRemainingTokensAndAcknowledges() throws Exception {
        // given: 첫 번째 토큰 발송이 실패해도 두 번째 토큰은 계속 처리해야 한다.
        ExpenseSettledNotificationEvent event = ExpenseSettledNotificationEvent.builder()
                .expenseId(301L)
                .expenseTitle("회식 정산")
                .payerUserId(7L)
                .build();
        String payload = objectMapper.writeValueAsString(event);

        List<UserFcmToken> tokens = List.of(
                createToken(1L, 7L, "token-1"),
                createToken(2L, 7L, "token-2")
        );
        when(userFcmTokenRepository.findAllByUserIdAndIsActiveTrueAndNotificationEnabledTrue(7L))
                .thenReturn(tokens);
        doThrow(new RuntimeException("FCM failed"))
                .when(notificationMessageService)
                .sendExpenseSettledMessage("token-1", "회식 정산");

        // when: consumer가 이벤트를 소비한다.
        consumer.consume(payload, acknowledgment);

        // then: 실패한 토큰 이후에도 남은 토큰을 계속 처리하고 ack 한다.
        verify(notificationMessageService).sendExpenseSettledMessage("token-1", "회식 정산");
        verify(notificationMessageService).sendExpenseSettledMessage("token-2", "회식 정산");
        verify(acknowledgment).acknowledge();
    }

    private UserFcmToken createToken(Long id, Long userId, String fcmToken) {
        return UserFcmToken.builder()
                .id(id)
                .userId(userId)
                .deviceId("device-" + id)
                .fcmToken(fcmToken)
                .notificationEnabled(true)
                .isActive(true)
                .build();
    }
}
