package com.duckchi.pay.domain.badge.service;

import com.duckchi.pay.domain.badge.dto.BadgeCheckRequest;
import com.duckchi.pay.infra.client.CoreClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;

/*
 * 뱃지 트리거 호출 유틸리티 서비스.
 *
 * Pay Service의 비즈니스 로직(정산, 방 생성 등)에서 이벤트가 발생했을 때
 * Core Service의 BADGE-02 API를 호출하여 뱃지 진행도를 갱신한다.
 *
 * [장애 격리 원칙]
 * 뱃지 API 호출 실패가 본 비즈니스 트랜잭션(정산, 방 생성 등)을
 * 롤백시키면 안 된다. 따라서 모든 호출은 try-catch로 감싸서
 * 실패 시 로그만 남기고 무시한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BadgeTriggerService {

    private final CoreClient coreClient;

    // 칼입금 암살자 기준: 정산 생성 후 1시간(3600초) 이내 완료
    private static final long ASSASSIN_THRESHOLD_SECONDS = 3600;
    // 거북이덕 기준: 정산 생성 후 48시간(172800초) 초과
    private static final long TURTLE_THRESHOLD_SECONDS = 172800;
    // 올빼미덕 기준: 자정(0시) ~ 새벽 5시 사이
    private static final LocalTime NIGHT_START = LocalTime.MIDNIGHT;
    private static final LocalTime NIGHT_END = LocalTime.of(5, 0);

    /*
     * [ROOM_CREATED] 모임방 생성 시 트리거.
     * 관련 뱃지: ALLEY_BOSS (+1), INSSA_DUCK (+1)
     *
     * @param userId 방을 생성한 유저 ID (방장)
     */
    public void triggerRoomCreated(Long userId) {
        BadgeCheckRequest request = BadgeCheckRequest.builder()
                .userId(userId)
                .eventType("ROOM_CREATED")
                .build();

        callBadgeCheckSafely(request, "ROOM_CREATED");
    }

    /*
     * [SETTLEMENT_COMPLETED] 정산 송금 완료 시 트리거.
     * 관련 뱃지: NOBLE_DUCK, ASSASSIN_DUCK, TURTLE_DUCK, NIGHTOWL_DUCK
     *
     * 정산 생성 시각(createdAt)과 완료 시각(completedAt)의 차이를 계산하여
     * 각 뱃지 조건(1시간 이내, 48시간 초과, 새벽 시간대)을 자동 판별한다.
     *
     * @param payerUserId 송금한 유저 ID
     * 
     * @param amount 송금 금액 (원 단위)
     * 
     * @param createdAt 정산 요청 생성 시각
     * 
     * @param completedAt 정산 완료 시각
     */
    public void triggerSettlementCompleted(Long payerUserId, int amount,
            LocalDateTime createdAt, LocalDateTime completedAt) {
        // 정산 생성~완료 사이의 시간차(초)를 계산
        long elapsedSeconds = Duration.between(createdAt, completedAt).getSeconds();

        // 칼입금 암살자: 1시간(3600초) 이내에 송금 완료했는지
        boolean isAssassin = elapsedSeconds <= ASSASSIN_THRESHOLD_SECONDS;

        // 거북이덕: 48시간(172800초)을 초과해서 송금했는지
        boolean isTurtle = elapsedSeconds > TURTLE_THRESHOLD_SECONDS;

        // 올빼미덕: 완료 시각이 자정~새벽 5시 사이인지
        LocalTime completedTime = completedAt.toLocalTime();
        boolean isNightOwl = !completedTime.isBefore(NIGHT_START) && completedTime.isBefore(NIGHT_END);

        BadgeCheckRequest request = BadgeCheckRequest.builder()
                .userId(payerUserId)
                .eventType("SETTLEMENT_COMPLETED")
                .amount(amount)
                .isAssassin(isAssassin)
                .isTurtle(isTurtle)
                .isNightOwl(isNightOwl)
                .build();

        callBadgeCheckSafely(request, "SETTLEMENT_COMPLETED");
    }

    /*
     * Core Service의 BADGE-02 API를 호출한다.
     * 실패해도 본 트랜잭션에 영향을 주지 않도록 예외를 잡아 로그만 남긴다.
     */
    public void callBadgeCheckSafely(BadgeCheckRequest request, String eventType) {
        try {
            coreClient.checkBadge(request);
            log.info("[BadgeTrigger] 뱃지 체크 호출 성공. eventType={}, userId={}",
                    eventType, request.getUserId());
        } catch (Exception e) {
            // 장애 격리: 뱃지 API 실패가 정산/방 생성 등 핵심 로직을 중단시키지 않는다.
            log.warn("[BadgeTrigger] 뱃지 체크 호출 실패 (무시됨). eventType={}, userId={}, error={}",
                    eventType, request.getUserId(), e.getMessage());
        }
    }
}
