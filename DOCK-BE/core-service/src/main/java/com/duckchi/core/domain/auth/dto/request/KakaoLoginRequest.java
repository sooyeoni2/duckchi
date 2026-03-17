package com.duckchi.core.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class KakaoLoginRequest {

    @NotBlank(message = "Authorization code is required.")
    private String authorizationCode;
    
    @NotBlank(message = "리다이렉트 URI는 필수입니다.")
    private String redirectUri;
    
    private String email;
}
