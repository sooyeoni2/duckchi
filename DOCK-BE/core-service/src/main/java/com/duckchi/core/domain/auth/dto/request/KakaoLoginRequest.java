package com.duckchi.core.domain.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class KakaoLoginRequest {
    @NotBlank(message = "인가 코드는 필수입니다.")
    private String authorizationCode;
    
    // 이메일은 선택 사항일 수 있으나 명세상 RequestBody에 포함되어 있음
    private String email;
}
