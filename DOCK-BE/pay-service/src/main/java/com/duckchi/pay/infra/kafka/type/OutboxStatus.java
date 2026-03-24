package com.duckchi.pay.infra.kafka.type;

//Outbox 상태
public enum OutboxStatus {

    PENDING,
    PUBLISHED,
    FAILED
}
