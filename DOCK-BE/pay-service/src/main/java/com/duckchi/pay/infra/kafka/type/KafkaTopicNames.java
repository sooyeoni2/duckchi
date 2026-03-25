package com.duckchi.pay.infra.kafka.type;

public final class KafkaTopicNames {

    //모임방 시작,종료 이벤트 토픽 이름
    public static final String ROOM_LIFECYCLE_NOTIFICATION_EVENT = "room-lifecycle-notification-event";

    //정산 완료 이벤트 토픽 이름
    public static final String EXPENSE_SETTLED_NOTIFICATION_EVENT = "expense-settled-notification-event";

    //정산 요청 이벤트 토픽 이름
    public static final String SETTLEMENT_REQUEST_NOTIFICATION_EVENT = "settlement-request-notification-event";

    private KafkaTopicNames(){

    }
}
