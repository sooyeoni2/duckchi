package com.duckchi.core.domain.user.controller;

import com.duckchi.core.domain.user.dto.request.UserProfileEditRequest;
import com.duckchi.core.domain.user.dto.request.UserProfileImageEditRequest;
import com.duckchi.core.domain.user.dto.response.UserProfileDetailResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileEditResponse;
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
@RequestMapping("/api/v1/profiles")
@Tag(name = "Profile", description = "사용자 프로필 API")
public class UserProfileController {

    private final UserProfileService userProfileService;

    @Operation(summary = "프로필 상세 조회 API", description = "사용자의 프로필, 계좌, 뱃지 정보를 조회합니다.")
    @GetMapping("/detail")
    public ResponseEntity<ApiResponseDto<UserProfileDetailResponse>> getProfileDetail(
            @RequestHeader("X-User-Id") Long userId
    ) {
        UserProfileDetailResponse response = userProfileService.getProfileDetail(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @Operation(summary = "자동이체 한도 변경 API", description = "사용자의 자동이체 한도를 변경합니다.")
    @PatchMapping("/edit")
    public ResponseEntity<ApiResponseDto<Void>> editTransferLimit(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UserProfileEditRequest request
    ) {
        userProfileService.editTransferLimit(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(null, "자동이체 한도가 변경되었습니다."));
    }

    @Operation(summary = "프로필 이미지 변경 API", description = "사용자의 프로필 이미지를 변경합니다.")
    @PostMapping("/edit")
    public ResponseEntity<ApiResponseDto<UserProfileEditResponse>> editProfileImage(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UserProfileImageEditRequest request
    ) {
        UserProfileEditResponse response = userProfileService.editProfileImage(userId, request);
        return ResponseEntity.ok(ApiResponseDto.success(response, "프로필 이미지가 변경되었습니다."));
    }
}
