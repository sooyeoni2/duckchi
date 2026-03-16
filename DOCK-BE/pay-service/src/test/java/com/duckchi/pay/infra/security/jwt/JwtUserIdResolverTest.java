package com.duckchi.pay.infra.security.jwt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JwtUserIdResolverTest {

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private JwtUserIdResolver jwtUserIdResolver;

    @Test
    void resolveRequired_validToken_returnsUserId() {
        when(jwtProvider.validateToken("valid-token")).thenReturn(true);
        when(jwtProvider.getUserIdFromToken("valid-token")).thenReturn(7L);

        Long userId = jwtUserIdResolver.resolveRequired("Bearer valid-token");

        assertEquals(7L, userId);
    }

    @Test
    void resolveRequired_missingHeader_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> jwtUserIdResolver.resolveRequired(null));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
    }

    @Test
    void resolveOrNull_missingHeader_returnsNull() {
        assertNull(jwtUserIdResolver.resolveOrNull(null));
    }

    @Test
    void resolveOrNull_invalidPrefix_throwsUnauthorized() {
        CustomException ex = assertThrows(CustomException.class,
                () -> jwtUserIdResolver.resolveOrNull("Token abc"));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
    }

    @Test
    void resolveOrNull_invalidToken_throwsUnauthorized() {
        when(jwtProvider.validateToken("invalid-token")).thenReturn(false);

        CustomException ex = assertThrows(CustomException.class,
                () -> jwtUserIdResolver.resolveOrNull("Bearer invalid-token"));

        assertEquals(ErrorCode.COMMON_UNAUTHORIZED, ex.getErrorCode());
    }
}