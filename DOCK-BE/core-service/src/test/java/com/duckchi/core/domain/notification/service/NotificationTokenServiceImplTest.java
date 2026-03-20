package com.duckchi.core.domain.notification.service;

import com.duckchi.core.domain.notification.dto.request.UpsertNotificationTokenRequest;
import com.duckchi.core.domain.notification.dto.response.NotificationTokenResponse;
import com.duckchi.core.domain.notification.entity.UserFcmToken;
import com.duckchi.core.domain.notification.repository.UserFcmTokenRepository;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationTokenServiceImplTest {

    @Mock
    private UserFcmTokenRepository userFcmTokenRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationTokenServiceImpl notificationTokenService;

    @Test
    void upsert_whenDeviceRowDoesNotExist_savesNewTokenWithDefaultNotificationEnabled() {
        // given: 사용자가 존재하고 동일한 user_id + device_id row와 token row가 모두 없다.
        Long userId = 1L;
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "token-1",
                null
        );
        UserFcmToken savedToken = createToken(10L, userId, "device-1", "token-1", true, true);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(userFcmTokenRepository.findByUserIdAndDeviceId(userId, "device-1")).thenReturn(Optional.empty());
        when(userFcmTokenRepository.findByFcmToken("token-1")).thenReturn(Optional.empty());
        when(userFcmTokenRepository.save(any(UserFcmToken.class))).thenReturn(savedToken);

        // when: 토큰 upsert를 요청한다.
        NotificationTokenResponse response = notificationTokenService.upsert(userId, request);

        // then: 새 row가 저장되고 notificationEnabled 기본값 true가 응답에 반영된다.
        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.deviceId()).isEqualTo("device-1");
        assertThat(response.notificationEnabled()).isTrue();
        assertThat(response.is_active()).isTrue();

        verify(userFcmTokenRepository).save(any(UserFcmToken.class));
        verify(userFcmTokenRepository, never()).delete(any(UserFcmToken.class));
    }

    @Test
    void upsert_whenSameTokenExistsOnDifferentRow_deletesStaleRowAndUpdatesCurrentRow() {
        // given: 현재 디바이스 row가 존재하고, 같은 token이 다른 stale row에도 연결되어 있다.
        Long userId = 1L;
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest(
                "device-1",
                "token-new",
                false
        );
        UserFcmToken currentToken = createToken(11L, userId, "device-1", "token-old", true, false);
        UserFcmToken staleToken = createToken(99L, 2L, "device-old", "token-new", true, true);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(userFcmTokenRepository.findByUserIdAndDeviceId(userId, "device-1")).thenReturn(Optional.of(currentToken));
        when(userFcmTokenRepository.findByFcmToken("token-new")).thenReturn(Optional.of(staleToken));
        when(userFcmTokenRepository.save(currentToken)).thenReturn(currentToken);

        // when: 최신 token으로 같은 디바이스 row를 갱신한다.
        NotificationTokenResponse response = notificationTokenService.upsert(userId, request);

        // then: stale row는 삭제되고 현재 row는 새 token과 알림 설정으로 갱신된다.
        assertThat(currentToken.getFcmToken()).isEqualTo("token-new");
        assertThat(currentToken.isNotificationEnabled()).isFalse();
        assertThat(currentToken.isActive()).isTrue();
        assertThat(response.id()).isEqualTo(11L);
        assertThat(response.deviceId()).isEqualTo("device-1");
        assertThat(response.notificationEnabled()).isFalse();
        assertThat(response.is_active()).isTrue();

        verify(userFcmTokenRepository).delete(staleToken);
        verify(userFcmTokenRepository).flush();
        verify(userFcmTokenRepository).save(currentToken);
    }

    @Test
    void upsert_whenUserDoesNotExist_throwsUnauthorizedException() {
        // given: 요청 userId에 해당하는 사용자가 존재하지 않는다.
        Long userId = 1L;
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest("device-1", "token-1", true);

        when(userRepository.existsById(userId)).thenReturn(false);

        // when & then: 인증 예외를 반환하고 저장 로직은 실행되지 않는다.
        assertThatThrownBy(() -> notificationTokenService.upsert(userId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.AUTH_UNAUTHORIZED);
                });

        verify(userFcmTokenRepository, never()).findByUserIdAndDeviceId(any(), any());
        verify(userFcmTokenRepository, never()).save(any(UserFcmToken.class));
    }

    @Test
    void upsert_whenUniqueConstraintFails_throwsNotificationConflictException() {
        // given: 저장 시점에 unique 제약 충돌이 발생한다.
        Long userId = 1L;
        UpsertNotificationTokenRequest request = new UpsertNotificationTokenRequest("device-1", "token-1", true);

        when(userRepository.existsById(userId)).thenReturn(true);
        when(userFcmTokenRepository.findByUserIdAndDeviceId(userId, "device-1")).thenReturn(Optional.empty());
        when(userFcmTokenRepository.findByFcmToken("token-1")).thenReturn(Optional.empty());
        when(userFcmTokenRepository.save(any(UserFcmToken.class))).thenThrow(new DataIntegrityViolationException("unique"));

        // when & then: 충돌 예외가 프로젝트 에러 코드로 변환된다.
        assertThatThrownBy(() -> notificationTokenService.upsert(userId, request))
                .isInstanceOf(CustomException.class)
                .satisfies(throwable -> {
                    CustomException ex = (CustomException) throwable;
                    assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.NOTIFICATION_TOKEN_CONFLICT);
                });

        verify(userFcmTokenRepository).save(any(UserFcmToken.class));
    }

    private UserFcmToken createToken(
            Long id,
            Long userId,
            String deviceId,
            String fcmToken,
            boolean notificationEnabled,
            boolean isActive
    ) {
        return UserFcmToken.builder()
                .id(id)
                .userId(userId)
                .deviceId(deviceId)
                .fcmToken(fcmToken)
                .notificationEnabled(notificationEnabled)
                .isActive(isActive)
                .createdAt(LocalDateTime.of(2026, 3, 20, 10, 0))
                .updatedAt(LocalDateTime.of(2026, 3, 20, 10, 5))
                .build();
    }
}
