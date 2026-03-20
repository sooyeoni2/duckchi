package com.duckchi.core.domain.notification.controller;

import com.duckchi.core.domain.notification.dto.request.UpsertNotificationTokenRequest;
import com.duckchi.core.domain.notification.dto.response.NotificationTokenResponse;
import com.duckchi.core.domain.notification.service.NotificationTokenService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notification", description = "FCM 토큰 등록 API")
public class NotificationTokenController {

    private final NotificationTokenService notificationTokenService;

    @Operation(
            summary = "FCM 토큰 upsert API",
            description = "인증 사용자 기준으로 deviceId 단위 FCM 토큰을 등록하거나 갱신합니다."
    )
    @PostMapping("/token")
    public ResponseEntity<ApiResponseDto<NotificationTokenResponse>> upsertNotificationToken(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpsertNotificationTokenRequest request
    ) {
        NotificationTokenResponse response = notificationTokenService.upsert(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response, "FCM 토큰이 등록되었습니다."));
    }
}
