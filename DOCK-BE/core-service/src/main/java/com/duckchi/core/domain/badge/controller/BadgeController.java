package com.duckchi.core.domain.badge.controller;

import com.duckchi.core.domain.badge.service.BadgeService;
import com.duckchi.core.domain.user.dto.response.UserProfileBadgeResponse;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/profiles")
@Tag(name = "Badge", description = "뱃지 API")
public class BadgeController {

    private final BadgeService badgeService;

    @Operation(summary = "뱃지 전체 조회 API", description = "사용자의 획득/미획득 뱃지 목록을 조회합니다.")
    @GetMapping("/badges")
    public ResponseEntity<ApiResponseDto<UserProfileBadgeResponse>> getBadges(
            @RequestHeader("X-User-Id") Long userId
    ) {
        UserProfileBadgeResponse response = badgeService.getBadges(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }
}
