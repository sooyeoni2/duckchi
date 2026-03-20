package com.duckchi.core.domain.notification.service;

import com.duckchi.core.domain.notification.dto.request.UpsertNotificationTokenRequest;
import com.duckchi.core.domain.notification.dto.response.NotificationTokenResponse;
import com.duckchi.core.domain.notification.entity.UserFcmToken;
import com.duckchi.core.domain.notification.repository.UserFcmTokenRepository;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationTokenServiceImpl implements NotificationTokenService {

    private final UserFcmTokenRepository userFcmTokenRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationTokenResponse upsert(Long userId, UpsertNotificationTokenRequest request) {
        //user 존재 확인
        if (!userRepository.existsById(userId)) {
            throw new CustomException(ErrorCode.AUTH_UNAUTHORIZED);
        }

        // notificationEnabled가 null이면 기본 true로 간주
        boolean notificationEnabled = request.notificationEnabled() == null || request.notificationEnabled();

        try {
            // upsert의 기준 키는 device_id
            // "같은 앱 설치 인스턴스"를 하나의 row로 보고, 현재 로그인 사용자 기준으로 재귀속
            // 기존 row가 있으면 update, 없으면 insert 방향으로 진행
            UserFcmToken currentToken = userFcmTokenRepository.findByDeviceId(request.deviceId())
                    .orElse(null);

            // 같은 token이 다른 row에 이미 연결되어 있는지 먼저 확인
            //
            // - 앱 재설치 후 새 deviceId로 다시 등록한 경우
            // - 이전 계정/이전 row에 token이 남아 있는 경우
            // - FCM token 재발급/재연결 과정에서 stale row가 남은 경우
            //
            // 현재 요청의 대상 row와 다른 row라면 stale row로 보고 정리
            // 비활성화 표시 후 row 자체를 삭제해서 현재 row가 같은 token을 저장할 수 있게 만든다.
            userFcmTokenRepository.findByFcmToken(request.token())
                    .filter(found -> isDifferentRow(found, currentToken))
                    .ifPresent(found -> {
                        found.deactivate();
                        userFcmTokenRepository.delete(found);
                        // delete SQL을 즉시 DB에 반영해서 unique(fcm_token) 점유를 먼저 해제
                        // 이렇게 해야 바로 뒤 save에서 같은 token으로 저장할 때 충돌 가능성을 줄일 수 있음
                        userFcmTokenRepository.flush();
                    });

            UserFcmToken savedToken;

            if (currentToken != null) { //(device_id) row가 이미 존재하는 경우
                // 같은 device_id row가 이미 존재하면 새 row를 만들지 않고 현재 row를 갱신
                // 같은 기기에서 다른 사용자가 로그인한 경우도 현재 사용자 기준으로 user_id를 재설정
                // FCM token은 재발급될 수 있으므로 최신 token으로 덮어씀
                currentToken.updateRegistration(userId, request.token(), notificationEnabled);
                savedToken = userFcmTokenRepository.save(currentToken);
            } else { //(device_id) row가 없으면 새로 등록
                // 기존 row가 없으면 최초 등록으로 판단하고 새 row를 생성한다.
                savedToken = userFcmTokenRepository.save(
                        UserFcmToken.builder()
                                .userId(userId)
                                .deviceId(request.deviceId())
                                .fcmToken(request.token())
                                .notificationEnabled(notificationEnabled)
                                .isActive(true)
                                .build()
                );
            }

            // 응답에는 token 자체는 포함X
            return new NotificationTokenResponse(
                    savedToken.getId(),
                    savedToken.getDeviceId(),
                    savedToken.isNotificationEnabled(),
                    savedToken.isActive(),
                    savedToken.getUpdatedAt()
            );
        } catch (CustomException ex) {
            // 도메인 의도를 담아 직접 던진 예외는 그대로 상위 핸들러로 전달한다.
            throw ex;
        } catch (DataIntegrityViolationException ex) {
            // 동시성 상황 등으로 unique 제약에 걸린 경우를 별도 충돌 예외로 변환한다.
            throw new CustomException(ErrorCode.NOTIFICATION_TOKEN_CONFLICT);
        } catch (Exception ex) {
            // 그 외 예외는 알림 토큰 등록 실패로 감싸서 일관된 API 에러 응답을 보낸다.
            throw new CustomException(ErrorCode.NOTIFICATION_TOKEN_UPSERT_FAILED);
        }
    }

    private boolean isDifferentRow(UserFcmToken found, UserFcmToken currentToken) {
        // 현재 upsert 대상 row가 없거나,
        // 있어도 PK가 다르면 "같은 token이 다른 row에 묶여 있는 상황"으로 봄
        return currentToken == null || !Objects.equals(found.getId(), currentToken.getId());
    }
}
