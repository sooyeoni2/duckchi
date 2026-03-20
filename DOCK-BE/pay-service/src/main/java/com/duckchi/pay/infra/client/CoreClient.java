package com.duckchi.pay.infra.client;

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
}
