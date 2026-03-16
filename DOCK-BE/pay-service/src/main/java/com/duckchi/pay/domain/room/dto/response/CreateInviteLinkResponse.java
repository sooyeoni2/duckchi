package com.duckchi.pay.domain.room.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CreateInviteLinkResponse {

    private Long roomId;
    private String inviteLink;
    private String inviteToken;
    private String status;
    private LocalDateTime expiresAt;
    private boolean regenerated;
}
