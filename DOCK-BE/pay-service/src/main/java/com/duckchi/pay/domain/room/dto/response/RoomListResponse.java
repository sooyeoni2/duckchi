package com.duckchi.pay.domain.room.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class RoomListResponse {

    private Long roomId;
    private String roomName;
    private String category;
    private String description;

    @JsonProperty("isProgress")
    private boolean isProgress;

    private List<Long> participants;
    private int participantCount;
    private int totalPay;
    private int payCount;
    private int percent;
}