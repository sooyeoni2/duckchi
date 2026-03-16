package com.duckchi.core.infra.finance;

import com.duckchi.core.infra.finance.dto.request.CheckAuthCodeRequest;
import com.duckchi.core.infra.finance.dto.request.OpenAccountAuthRequest;
import com.duckchi.core.infra.finance.dto.response.CheckAuthCodeResponse;
import com.duckchi.core.infra.finance.dto.response.OpenAccountAuthResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * SSAFY 금융망 accountAuth API 전용 FeignClient.
 */
@FeignClient(
        name = "finance-client",
        url = "${finance.api.base-url}",
        path = "/ssafy/api/v1/edu"
)
public interface FinanceClient {

    //1원 송금 API 호출
    @PostMapping("/accountAuth/openAccountAuth")
    OpenAccountAuthResponse openAccountAuth(@RequestBody OpenAccountAuthRequest request);

    //1원 송금 검증 API 호출
    @PostMapping("/accountAuth/checkAuthCode")
    CheckAuthCodeResponse checkAuthCode(@RequestBody CheckAuthCodeRequest request);
}
