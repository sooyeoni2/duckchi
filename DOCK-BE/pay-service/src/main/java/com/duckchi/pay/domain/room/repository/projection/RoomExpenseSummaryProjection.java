package com.duckchi.pay.domain.room.repository.projection;

public interface RoomExpenseSummaryProjection {

    Long getRoomId();

    Long getTotalPay();

    Long getPayCount();
}