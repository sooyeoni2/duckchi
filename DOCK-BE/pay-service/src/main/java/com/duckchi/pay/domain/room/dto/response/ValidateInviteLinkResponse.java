package com.duckchi.pay.domain.room.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ValidateInviteLinkResponse {

    private boolean valid;
    private Long roomId;
    private String roomName;
    private boolean alreadyParticipant;

    public static ValidateInviteLinkResponse of(
            boolean valid,
            Long roomId,
            String roomName,
            boolean alreadyParticipant
    ) {
        return ValidateInviteLinkResponse.builder()
                .valid(valid)
                .roomId(roomId)
                .roomName(roomName)
                .alreadyParticipant(alreadyParticipant)
                .build();
    }
}
