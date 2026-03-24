package com.duckchi.pay.infra.kafka.type;

public final class KafkaTopicNames {

    //모임방 시작,종료 이벤트 토픽 이름
    public static final String ROOM_LIFECYCLE_NOTIFICATION_EVENT = "room-lifecycle-notification-event";

    // 뱃지 조건 체크 이벤트 토픽 이름 (Pay → Core)
    public static final String BADGE_CHECK_EVENT = "badge-check-event";

    // 정산 완료 이벤트 토픽 이름 (Pay → Insight)
    public static final String SETTLEMENT_FINISHED_EVENT = "settlement-finished-event";

    private KafkaTopicNames(){

    }
}
