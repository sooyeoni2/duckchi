package com.duckchi.core.infra.finance;

import com.duckchi.core.infra.finance.dto.request.MemberRequest;
import com.duckchi.core.infra.finance.dto.response.MemberResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

/**
 * SSAFY 금융망 Member API 전용 FeignClient (유저 키 발급용).
 */
@FeignClient(
        name = "member-client",
        url = "${finance.api.base-url}",
        path = "/ssafy/api/v1/member"
)
public interface MemberClient {

    // 유저 조회
    @PostMapping("/search")
    MemberResponse searchMember(@RequestBody MemberRequest request);

    // 유저 생성
    @PostMapping
    MemberResponse createMember(@RequestBody MemberRequest request);
}
