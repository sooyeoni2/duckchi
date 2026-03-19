package com.duckchi.core.domain.user.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class UserProfileSnapshotResponse {
    private Long userId;
    private String userName;
    private String userTag;
    private String profileImageUrl;
}
