package com.duckchi.pay.infra.config;

import feign.Retryer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FinanceFeignConfig {

    /**
     * 송금 API 자동 재시도는 중복 이체 위험이 있으므로 비활성화한다.
     */
    @Bean
    public Retryer financeRetryer() {
        return Retryer.NEVER_RETRY;
    }
}