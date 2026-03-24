package com.duckchi.core.domain.user.controller;

import com.duckchi.core.domain.user.dto.request.NotificationSettingRequest;
import com.duckchi.core.domain.user.service.UserProfileService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Tag(name = "User", description = "사용자 설정 API")
public class UserController {

    private final UserProfileService userProfileService;

    @Operation(summary = "알림 설정 변경 API", description = "사용자의 알림 수신 여부를 변경합니다.")
    @PatchMapping("/notification")
    public ResponseEntity<ApiResponseDto<Void>> updateNotificationSetting(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody NotificationSettingRequest request
    ) {
        userProfileService.updateNotificationSetting(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(null, "알림 설정이 변경되었습니다."));
    }
}
