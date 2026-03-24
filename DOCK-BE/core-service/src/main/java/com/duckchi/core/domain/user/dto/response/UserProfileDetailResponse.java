package com.duckchi.core.domain.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDetailResponse {

    private Long userId;
    private String email;
    private String name;
    private String tag;
    private Integer transferLimit;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private Boolean notificationEnabled;
    private List<AccountSummary> accounts;
    private List<Object> badges;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AccountSummary {
        private Long accountId;
        private String bankCode;
        private String bankName;
        private String accountNumber;
        private LocalDateTime registeredAt;
    }
}
