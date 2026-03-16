package com.duckchi.core.domain.auth.controller;

import com.duckchi.core.domain.auth.dto.request.KakaoLoginRequest;
import com.duckchi.core.domain.auth.dto.response.LoginResponse;
import com.duckchi.core.domain.auth.service.AuthService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
}
