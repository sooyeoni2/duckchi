package com.duckchi.core.domain.auth.controller;

import com.duckchi.core.domain.auth.dto.request.KakaoLoginRequest;
import com.duckchi.core.domain.auth.dto.request.TokenRefreshRequest;
import com.duckchi.core.domain.auth.dto.response.LoginResponse;
import com.duckchi.core.domain.auth.dto.response.TokenRefreshResponse;
import com.duckchi.core.domain.auth.service.AuthService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Auth", description = "인증 관련 API")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "소셜 로그인(카카오)", description = "카카오 인가 코드를 사용하여 로그인을 진행합니다.")
    @PostMapping("/oauth/login")
    public ApiResponseDto<LoginResponse> login(@Valid @RequestBody KakaoLoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponseDto.success(response);
    }

    @Operation(summary = "액세스 토큰 재발급", description = "리프레시 토큰을 검증하고 새 액세스 토큰을 발급합니다.")
    @PostMapping("/token/refresh")
    public ApiResponseDto<TokenRefreshResponse> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refresh(request);
        return ApiResponseDto.success(response);
    }

    @Operation(summary = "로그아웃", description = "현재 세션의 리프레시 토큰을 제거하고 액세스 토큰을 무효화합니다.")
    @PostMapping("/oauth/logout")
    public ApiResponseDto<Void> logout(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        authService.logout(authorizationHeader);
        return ApiResponseDto.successMsg("로그아웃에 성공했습니다.");
    }
}
