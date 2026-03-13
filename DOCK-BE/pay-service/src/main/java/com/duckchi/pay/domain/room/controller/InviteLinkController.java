package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.response.CreateInviteLinkResponse;
import com.duckchi.pay.domain.room.dto.response.ValidateInviteLinkResponse;
import com.duckchi.pay.domain.room.service.InviteLinkService;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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

    private final InviteLinkService inviteLinkService;

    @PostMapping("/{roomId}/link")
    @Operation(summary = "ROOM-02 초대 링크 생성/공유")
    public ResponseEntity<ApiResponseDto<CreateInviteLinkResponse>> createInviteLink(
            @PathVariable Long roomId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId
    ) {
        CreateInviteLinkResponse response = inviteLinkService.createInviteLink(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/{inviteToken}")
    @Operation(summary = "ROOM-03 초대 링크 검증 및 프리뷰")
    public ResponseEntity<ApiResponseDto<ValidateInviteLinkResponse>> validateInviteLink(
            @PathVariable String inviteToken,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId
    ) {
        ValidateInviteLinkResponse response = inviteLinkService.validateInviteLink(inviteToken, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }
}