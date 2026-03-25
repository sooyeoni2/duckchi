package com.duckchi.insight.infra.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

@Configuration
public class SwaggerConfig {

    @Value("${server.port}")
    private String port;

    @Value("${spring.application.name}")
    private String serviceName;

    @Value("${swagger.server-url:}")
    private String swaggerServerUrl;

    @Bean
    @Primary
    public OpenAPI openAPI() {
        String serverUrl = StringUtils.hasText(swaggerServerUrl)
                ? swaggerServerUrl
                : "http://localhost:" + port;

        return new OpenAPI()
                .components(new Components())
                .info(new Info()
                        .title("Duckchi swagger : " + serviceName)
                        .description("사용자의 지출 내역을 분석하여 월별/카테고리별/방별 통계 및 트렌드를 제공하는 API입니다.")
                        .version("1.0.0"))
                .addServersItem(new Server().url(serverUrl).description("Duckchi Server"));
    }

}
