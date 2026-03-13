package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;

public interface InviteLinkService {

    CreateInviteLinkResponse createInviteLink(Long roomId, Long currentUserId);

    ValidateInviteLinkResponse validateInviteLink(String inviteToken, Long currentUserId);
}