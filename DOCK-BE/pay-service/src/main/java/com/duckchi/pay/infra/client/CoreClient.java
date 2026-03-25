package com.duckchi.pay.infra.client;

import com.duckchi.pay.domain.badge.dto.BadgeCheckRequest;
import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.domain.expense.dto.external.UserProfileBatchRequest;
import com.duckchi.pay.domain.expense.dto.external.UserProfileSnapshotResponse;
import com.duckchi.pay.global.response.ApiResponseDto;
import java.util.List;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "core-service")
public interface CoreClient {

    @GetMapping("/api/v1/internal/users/{userId}/finance-profile")
    ApiResponseDto<UserFinanceProfileResponse> getUserFinanceProfile(@PathVariable("userId") Long userId);

    @PostMapping("/api/v1/internal/users/profiles")
    ApiResponseDto<List<UserProfileSnapshotResponse>> getUserProfiles(@RequestBody UserProfileBatchRequest request);

    /**
     * [BADGE-02] Core Service의 뱃지 조건 체크 API 호출.
     * 이벤트 발생 시 뱃지 진행도를 갱신하고, 조건 충족 시 뱃지를 자동 부여한다.
     */
    @PostMapping("/api/v1/badges/check")
    ApiResponseDto<?> checkBadge(@RequestBody BadgeCheckRequest request);
}

