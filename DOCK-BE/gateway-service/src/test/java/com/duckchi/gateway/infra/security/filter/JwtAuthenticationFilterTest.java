package com.duckchi.gateway.infra.security.filter;

import com.duckchi.gateway.infra.security.jwt.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    @Test
    void publicAuthPathBypassesJwtValidation() {
        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("/api/v1/auth/oauth/login").build()
        );
        CapturingGatewayFilterChain chain = new CapturingGatewayFilterChain();

        filter.filter(exchange, chain).block();

        verifyNoInteractions(jwtProvider);
        assertEquals("/api/v1/auth/oauth/login", chain.capturedRequest.getURI().getPath());
    }

    @Test
    void protectedPathWithoutTokenReturnsUnauthorized() {
        JwtProvider jwtProvider = mock(JwtProvider.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/rooms").build()
        );

        filter.filter(exchange, request -> Mono.empty()).block();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verifyNoInteractions(jwtProvider);
    }

    @Test
    void authenticatedRequestInjectsTrustedUserIdHeader() {
        JwtProvider jwtProvider = mock(JwtProvider.class);
        when(jwtProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtProvider.getUserIdFromToken("valid-token")).thenReturn(7L);

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtProvider);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/v1/rooms")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                        .header("X-User-Id", "999")
                        .build()
        );
        CapturingGatewayFilterChain chain = new CapturingGatewayFilterChain();

        filter.filter(exchange, chain).block();

        verify(jwtProvider).validateToken("valid-token");
        verify(jwtProvider).getUserIdFromToken("valid-token");
        assertEquals("7", chain.capturedRequest.getHeaders().getFirst("X-User-Id"));
        assertNull(chain.capturedRequest.getHeaders().get("X-User-Id").stream()
                .filter("999"::equals)
                .findAny()
                .orElse(null));
    }

    private static final class CapturingGatewayFilterChain implements GatewayFilterChain {
        private ServerHttpRequest capturedRequest;

        @Override
        public Mono<Void> filter(org.springframework.web.server.ServerWebExchange exchange) {
            this.capturedRequest = exchange.getRequest();
            return Mono.empty();
        }
    }
}
