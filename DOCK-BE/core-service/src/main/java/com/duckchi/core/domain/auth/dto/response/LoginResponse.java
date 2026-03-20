package com.duckchi.core.domain.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoginResponse {
    @JsonProperty("isNewUser")
    private boolean newUser;
    private String accessToken;
    private String refreshToken;
    private UserResponse user;

    @Getter
    @Builder
    public static class UserResponse {
        private Long userId;
        private String email;
        private String name;
        private String tag;
        private boolean hasBankAccount;
        private boolean hasPayPassword;
    }
}
