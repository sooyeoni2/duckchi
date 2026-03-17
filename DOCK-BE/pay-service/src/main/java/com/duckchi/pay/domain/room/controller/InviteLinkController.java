package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;
import com.duckchi.pay.domain.room.service.InviteLinkService;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms/invites")
@Tag(name = "InviteLink", description = "ROOM invite API")
public class InviteLinkController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final InviteLinkService inviteLinkService;

    @PostMapping("/{roomId}/link")
    @Operation(summary = "ROOM-02 Create invite link")
    public ResponseEntity<ApiResponseDto<CreateInviteLinkResponse>> createInviteLink(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        CreateInviteLinkResponse response = inviteLinkService.createInviteLink(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/{inviteToken}")
    @Operation(summary = "ROOM-03 Validate invite link")
    public ResponseEntity<ApiResponseDto<ValidateInviteLinkResponse>> validateInviteLink(
            @PathVariable String inviteToken,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        // ROOM-03 is allowed to preview invite metadata without authentication.
        Long currentUserId = resolveOptionalUserId(userIdHeader);
        ValidateInviteLinkResponse response = inviteLinkService.validateInviteLink(inviteToken, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    private Long resolveRequiredUserId(String userIdHeader) {
        if (!StringUtils.hasText(userIdHeader)) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }
        try {
            return Long.parseLong(userIdHeader);
        } catch (NumberFormatException ex) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }

    private Long resolveOptionalUserId(String userIdHeader) {
        if (!StringUtils.hasText(userIdHeader)) {
            return null;
        }
        try {
            return Long.parseLong(userIdHeader);
        } catch (NumberFormatException ex) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }
}