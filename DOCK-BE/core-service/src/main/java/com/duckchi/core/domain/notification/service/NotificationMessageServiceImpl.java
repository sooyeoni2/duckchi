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

    private static final String ROOM_STARTED_TITLE = "모임 시작";
    private static final String ROOM_ENDED_TITLE = "모임 종료";
    private static final String BADGE_ACQUIRED_TITLE = "뱃지 획득";

    private final FirebaseMessaging firebaseMessaging;

    //알림 설정 완료 알림
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

    //모임방 시작 알림
    @Override
    public void sendRoomStartedMessage(String token, String roomName) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(ROOM_STARTED_TITLE)
                        .setBody(roomName + " 모임이 시작되었어요.")
                        .build())
                .build();

        send(message, token, "모임 시작 알림");
    }
    //모임방 종료 알림
    @Override
    public void sendRoomEndedMessage(String token, String roomName) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(ROOM_ENDED_TITLE)
                        .setBody(roomName + " 모임이 종료되었어요.")
                        .build())
                .build();

        send(message, token, "모임 종료 알림");
    }

    //뱃지 획득 알림
    @Override
    public void sendBadgeAcquiredMessage(String token, String badgeName) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(BADGE_ACQUIRED_TITLE)
                        .setBody("축하합니다! '" + badgeName + "' 뱃지를 획득했어요! 🎉")
                        .build())
                .build();

        send(message, token, "뱃지 획득 알림");
    }

    //firebase message 전송

    private void send(Message message, String token, String logLabel) {
        try {
            String messageId = firebaseMessaging.send(message);
            log.info("{} 발송 성공. messageId={}", logLabel, messageId);
        } catch (FirebaseMessagingException ex) {
            String errorMsg = ex.getMessage();
            if(errorMsg != null && errorMsg.contains("valid")){
                log.warn("유효하지 않은 FCM 토큰입니다.",ex);
                throw new CustomException(ErrorCode.NOTIFICATION_TOKEN_INVALID);
            }

            log.error("{} 발송 실패. token={}", logLabel, token, ex);
            throw new CustomException(ErrorCode.NOTIFICATION_TEST_SEND_FAILED);
        }
    }
}

