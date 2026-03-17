package com.duckchi.gateway.infra.security.filter;

import lombok.RequiredArgsConstructor;
import com.duckchi.gateway.infra.security.jwt.JwtProvider;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final List<String> PUBLIC_PATH_PREFIXES = List.of(
            "/api/v1/auth/",
            "/swagger-ui",
            "/v3/api-docs",
            "/actuator"
    );

    private final JwtProvider jwtProvider;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        ServerHttpRequest sanitizedRequest = exchange.getRequest()
                .mutate()
                .headers(headers -> headers.remove(USER_ID_HEADER))
                .build();

        ServerWebExchange sanitizedExchange = exchange.mutate()
                .request(sanitizedRequest)
                .build();

        if (isPublicPath(path)) {
            return chain.filter(sanitizedExchange);
        }

        String token = extractBearerToken(sanitizedRequest);
        if (!StringUtils.hasText(token) || !jwtProvider.validateToken(token)) {
            return writeUnauthorizedResponse(sanitizedExchange);
        }

        Long userId = jwtProvider.getUserIdFromToken(token);
        ServerHttpRequest authenticatedRequest = sanitizedRequest.mutate()
                .header(USER_ID_HEADER, String.valueOf(userId))
                .build();

        return chain.filter(sanitizedExchange.mutate().request(authenticatedRequest).build());
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATH_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private String extractBearerToken(ServerHttpRequest request) {
        String bearerToken = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Mono<Void> writeUnauthorizedResponse(ServerWebExchange exchange) {
        byte[] body = """
                {"success":false,"data":null,"msg":"Authentication is required.","errorCode":"COMMON-401-1"}
                """.getBytes(StandardCharsets.UTF_8);

        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        return exchange.getResponse()
                .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
