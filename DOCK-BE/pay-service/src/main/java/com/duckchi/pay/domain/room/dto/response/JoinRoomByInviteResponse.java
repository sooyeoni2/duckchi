package com.duckchi.pay.domain.room.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JoinRoomByInviteResponse {

    private Long roomId;
    private Long userId;
    @JsonProperty("isAdmin")
    private boolean isAdmin;
    @JsonProperty("isAgreed")
    private boolean isAgreed;
    private LocalDateTime joinedAt;
}
