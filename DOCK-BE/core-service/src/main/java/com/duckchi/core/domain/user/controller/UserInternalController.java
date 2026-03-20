package com.duckchi.core.domain.user.controller;

import com.duckchi.core.domain.user.dto.request.UserProfileBatchRequest;
import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileSnapshotResponse;
import com.duckchi.core.domain.user.service.UserInternalService;
import com.duckchi.core.global.response.ApiResponseDto;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 다른 서비스가 사용자 내부 정보를 조회할 때 사용하는 컨트롤러다.
 */
@RestController
@RequestMapping("/api/v1/internal/users")
@RequiredArgsConstructor
public class UserInternalController {

    private final UserInternalService userInternalService;

    /**
     * 특정 사용자의 금융 프로필을 조회한다.
     */
    @GetMapping("/{userId}/finance-profile")
    public ApiResponseDto<UserFinanceProfileResponse> getUserFinanceProfile(@PathVariable Long userId) {
        return ApiResponseDto.success(userInternalService.getUserFinanceProfile(userId));
    }

    /**
     * 여러 사용자에 대한 스냅샷용 프로필 정보를 한 번에 조회한다.
     */
    @PostMapping("/profiles")
    public ApiResponseDto<List<UserProfileSnapshotResponse>> getUserProfiles(
            @Valid @RequestBody UserProfileBatchRequest request
    ) {
        return ApiResponseDto.success(userInternalService.getUserProfiles(request.getUserIds()));
    }
}
