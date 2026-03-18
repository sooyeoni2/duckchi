package com.duckchi.pay.infra.client;

import com.duckchi.pay.domain.expense.dto.external.UserFinanceProfileResponse;
import com.duckchi.pay.global.response.ApiResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * core-service 내부 API와 통신하기 위한 Feign Client이다.
 */
@FeignClient(name = "core-service")
public interface CoreClient {

    /**
     * 사용자 ID를 기준으로 금융 프로필(SSAFY 사용자 키, 계좌번호)을 조회한다.
     */
    @GetMapping("/api/v1/internal/users/{userId}/finance-profile")
    ApiResponseDto<UserFinanceProfileResponse> getUserFinanceProfile(@PathVariable("userId") Long userId);
}
