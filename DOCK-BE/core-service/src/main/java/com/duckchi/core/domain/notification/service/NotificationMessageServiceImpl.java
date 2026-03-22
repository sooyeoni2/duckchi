package com.duckchi.core.domain.notification.service;

import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationMessageServiceImpl implements NotificationMessageService {

    private static final String NOTIFICATION_ENABLED_TITLE = "알림 설정 완료";
    private static final String NOTIFICATION_ENABLED_BODY = "알림이 설정되었습니다.";

    private final FirebaseMessaging firebaseMessaging;

    @Override
    public void sendNotificationEnabledMessage(String token) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(NOTIFICATION_ENABLED_TITLE)
                        .setBody(NOTIFICATION_ENABLED_BODY)
                        .build())
                .build();

        try {
            String messageId = firebaseMessaging.send(message);
            log.info("FCM 테스트 알림 발송 성공. messageId={}", messageId);
        } catch (FirebaseMessagingException ex) {
            log.error("FCM 테스트 알림 발송 실패. token={}", token, ex);
            throw new CustomException(ErrorCode.NOTIFICATION_TEST_SEND_FAILED);
        }
    }
}
