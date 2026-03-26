package com.duckchi.core.domain.notification.service;

import com.duckchi.core.domain.notification.dto.event.ExpenseSettledNotificationEvent;
import com.duckchi.core.domain.notification.dto.event.SettlementRequestNotificationEvent;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationMessageServiceImpl implements NotificationMessageService {

    private static final String NOTIFICATION_ENABLED_TITLE = "알림 설정 완료";
    private static final String NOTIFICATION_ENABLED_BODY = "알림이 설정되었습니다.";

    private static final String SETTLEMENT_REQUEST_TITLE = "정산 요청";

    private static final String ROOM_STARTED_TITLE = "모임 시작";
    private static final String ROOM_ENDED_TITLE = "모임 종료";
    private static final String BADGE_ACQUIRED_TITLE = "뱃지 획득";

    private static final String EXPENSE_SETTLED_TITLE = "정산 완료";

    private final FirebaseMessaging firebaseMessaging;
    private final ObjectMapper objectMapper;

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
            log.error("FCM 테스트 알림 발송 실패.", ex);
            throw new CustomException(ErrorCode.NOTIFICATION_TEST_SEND_FAILED);
        }
    }

    //정산 요청 알림 - 자동이체 동의자
    @Override
    public void sendSettlementRequestAutoMessage(String token, SettlementRequestNotificationEvent event) {

        String settlementIdsJson;
        //settlements에서 Id만 추출해서 json 문자열로 추출
        try {
            settlementIdsJson = objectMapper.writeValueAsString(event.getSettlements().keySet());
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("settlements에서 Id를 추출하는데 실패했습니다.", e);
        }
        //항목명 꺼내오기
        String expenseThumbNails = event.getSettlements().values().stream()
                .findFirst()
                .map(firstTitle -> {
                    int remainCount = event.getSettlements().size() - 1;
                    return remainCount > 0
                            ? firstTitle + " 외 " + remainCount + "건"
                            : firstTitle;
                })
                .orElse("0건");
        //넣을 데이터 조립
        Map<String,String> data = new HashMap<>();
        data.put("isAgreed","true"); //자동이체 동의 여부
        data.put("type","SETTLEMENT_REQUEST");// type(프론트 분기용)
        data.put("roomId",String.valueOf(event.getRoomId()));//roomId(프론트 라우팅용)
        data.put("settlementIds",settlementIdsJson); //settlementId 목록
        data.put("title",event.getRequesterUserName()+"님이 보낸 "+SETTLEMENT_REQUEST_TITLE);
        data.put("body",expenseThumbNails+"에 대한 정산을 완료해주세요. : "+event.getTotalAmount()+"원");


        Message message = Message.builder()
                .setToken(token)
                .putAllData(data)
                .build();

        send(message, token, "정산 요청 알림 - 자동이체 동의자");
    }

    //정산 요청 알림 - 자동이체 미동의자
    @Override
    public void sendSettlementRequestOneclickMessage(String token, SettlementRequestNotificationEvent event) {

        //항목명 꺼내오기
        String expenseThumbNails = event.getSettlements().values().stream()
                .findFirst()
                .map(firstTitle -> {
                    int remainCount = event.getSettlements().size() - 1;
                    return remainCount > 0
                            ? firstTitle + " 외 " + remainCount + "건"
                            : firstTitle;
                })
                .orElse("0건");

        //넣을 데이터 조립
        Map<String,String> data = new HashMap<>();
        data.put("isAgreed","false"); //자동이체 동의 여부
        data.put("type","SETTLEMENT_REQUEST");// type(프론트 분기용)
        data.put("roomId",String.valueOf(event.getRoomId()));//roomId(프론트 라우팅용)
        data.put("title",event.getRequesterUserName()+"님이 보낸 "+SETTLEMENT_REQUEST_TITLE);
        data.put("body",expenseThumbNails+"에 대한 정산을 완료해주세요. : "+event.getTotalAmount()+"원");

        Message message = Message.builder()
                .setToken(token)
                .putAllData(data)
                .build();

        send(message, token, "정산 요청 알림 - 자동이체 미동의자");
    }

    //정산 완료 알림
    @Override
    public void sendExpenseSettledMessage(String token, ExpenseSettledNotificationEvent event) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(EXPENSE_SETTLED_TITLE)
                        .setBody(event.getExpenseTitle() + " 에 대한 정산이 완료되었어요.")
                        .build())
                .putData("expenseId",String.valueOf(event.getExpenseId()))
                .putData("type","SETTLEMENT_COMPLETED")
                .putData("roomId",String.valueOf(event.getRoomId()))
                .putData("payerUserId",String.valueOf(event.getPayerUserId()))
                .build();

        send(message, token, "정산 완료 알림");
    }

    //모임방 시작 알림
    @Override
    public void sendRoomStartedMessage(String token, String roomName, Long roomId) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(ROOM_STARTED_TITLE)
                        .setBody(roomName + " 모임이 시작되었어요.")
                        .build())
                .putData("roomId",String.valueOf(roomId))
                .putData("type","ROOM_LIFECYCLE")
                .putData("eventType","ROOM_STARTED")
                .build();

        send(message, token, "모임 시작 알림");
    }
    //모임방 종료 알림
    @Override
    public void sendRoomEndedMessage(String token, String roomName,Long roomId) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(Notification.builder()
                        .setTitle(ROOM_ENDED_TITLE)
                        .setBody(roomName + " 모임이 종료되었어요.")
                        .build())
                .putData("roomId",String.valueOf(roomId))
                .putData("type","ROOM_LIFECYCLE")
                .putData("eventType","ROOM_ENDED")
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

            log.error("{} 발송 실패.", logLabel, ex);
            throw new CustomException(ErrorCode.NOTIFICATION_TEST_SEND_FAILED);
        }
    }
}

