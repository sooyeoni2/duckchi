package com.duckchi.core.domain.notification.service;

import com.duckchi.core.domain.notification.dto.event.SettlementRequestNotificationEvent;

public interface NotificationMessageService {

    //알림 설정 메세지
    void sendNotificationEnabledMessage(String token);

    //스케줄링 기반 리마인드 알림

    //정산 요청 도착 알림 - 자동이체 동의자
    void sendSettlementRequestAutoMessage(String token, SettlementRequestNotificationEvent event);
    //정산 요청 도착 알림 - 자동이체 미동의자
    void sendSettlementRequestOneclickMessage(String token, SettlementRequestNotificationEvent event);

    //정산 완료 알림
    void sendExpenseSettledMessage(String token, String expenseTitle);
    //모임 시작, 종료 알림
    void sendRoomStartedMessage(String token, String roomName);
    void sendRoomEndedMessage(String token, String roomName);

    //N빵 뽑기 알림

}
