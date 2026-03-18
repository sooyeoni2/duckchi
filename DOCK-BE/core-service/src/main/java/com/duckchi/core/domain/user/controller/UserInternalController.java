package com.duckchi.core.domain.user.controller;

import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;
import com.duckchi.core.domain.user.service.UserInternalService;
import com.duckchi.core.global.response.ApiResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 내부 서비스 간 사용자 금융 프로필 전달을 담당하는 컨트롤러이다.
 */
@RestController
@RequestMapping("/api/v1/internal/users")
@RequiredArgsConstructor
public class UserInternalController {

    private final UserInternalService userInternalService;

    /**
     * 특정 사용자의 금융 프로필을 조회하여 내부 서비스에 제공한다.
     */
    @GetMapping("/{userId}/finance-profile")
    public ApiResponseDto<UserFinanceProfileResponse> getUserFinanceProfile(@PathVariable Long userId) {
        return ApiResponseDto.success(userInternalService.getUserFinanceProfile(userId));
    }
}
