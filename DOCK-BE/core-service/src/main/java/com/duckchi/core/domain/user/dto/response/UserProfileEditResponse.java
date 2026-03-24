package com.duckchi.core.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileEditResponse {

    private Long userId;
    private String email;
    private String name;
    private String tag;
    private String profileImageUrl;
    private Integer transferLimit;
    private LocalDateTime createdAt;
}
