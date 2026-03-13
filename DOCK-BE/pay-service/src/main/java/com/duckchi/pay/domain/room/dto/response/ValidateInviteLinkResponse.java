package com.duckchi.pay.domain.room.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(staticName = "of")
public class ValidateInviteLinkResponse {

    private boolean valid;
}