package com.duckchi.insight.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger (OpenAPI) 설정 클래스
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI insightOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("소비 분석 서비스 API (Insight Service)")
                        .description("사용자의 지출 내역을 분석하여 월별/카테고리별/방별 통계 및 트렌드를 제공하는 API입니다.")
                        .version("v1.0.0"));
    }
}
