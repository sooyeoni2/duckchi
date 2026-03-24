package com.duckchi.core.domain.badge.service;

import com.duckchi.core.domain.badge.dto.request.BadgeCheckRequest;
import com.duckchi.core.domain.badge.dto.response.BadgeCheckResponse;
import com.duckchi.core.domain.badge.dto.response.BadgeCheckResponse.NewlyAcquiredBadgeDto;
import com.duckchi.core.domain.badge.entity.Badge;
import com.duckchi.core.domain.badge.entity.BadgeProgress;
import com.duckchi.core.domain.badge.entity.UserBadge;
import com.duckchi.core.domain.badge.repository.BadgeProgressRepository;
import com.duckchi.core.domain.badge.repository.BadgeRepository;
import com.duckchi.core.domain.badge.repository.UserBadgeRepository;
import com.duckchi.core.domain.user.entity.User;
import com.duckchi.core.domain.user.repository.UserRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * [BADGE-02] 뱃지 조건 체크 서비스 구현체.
 *
 * 이벤트 발생 시 해당 이벤트에 연관된 뱃지들의 진행도(badge_progress)를 갱신하고,
 * 목표 달성 시 사용자에게 뱃지를 부여(user_badges INSERT)한다.
 *
 * [핵심 설계 원칙]
 * - Pay Service 등 외부 서비스에서 "이미 판별된 결과(Payload)"를 받아서 처리한다.
 *   → Core Service가 직접 Pay DB를 조회하지 않고, 호출자가 조건 판별 결과를 전달.
 * - 이미 획득한 뱃지는 건너뛴다 (user_badges UK_USER_BADGES 유니크 키 보장).
 * - Kafka/FCM 연동은 추후 추가 예정. 현재는 DB 갱신 + 획득까지만 처리.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BadgeCheckServiceImpl implements BadgeCheckService {

    private final BadgeRepository badgeRepository;
    private final BadgeProgressRepository badgeProgressRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;

    @Override
    public BadgeCheckResponse checkAndAwardBadges(BadgeCheckRequest request) {
        Long userId = request.getUserId();

        // 사용자 존재 여부 확인
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.BADGE_USER_NOT_FOUND));

        // 이번 요청에서 새로 획득한 뱃지 목록
        List<NewlyAcquiredBadgeDto> newlyAcquired = new ArrayList<>();

        // 이벤트 타입별로 관련 뱃지 진행도를 갱신
        switch (request.getEventType()) {
            case SETTLEMENT_COMPLETED -> handleSettlementCompleted(user, request, newlyAcquired);
            case ROOM_JOINED -> handleRoomJoined(user, request, newlyAcquired);
            case ROOM_CREATED -> handleRoomCreated(user, request, newlyAcquired);
            case EXPENSE_OCR_ADDED -> handleExpenseOcrAdded(user, newlyAcquired);
            case ACCOUNT_REGISTERED -> handleAccountRegistered(user, request, newlyAcquired);
        }

        log.info("[BADGE-02] userId={}, eventType={}, newlyAcquired={}건",
                userId, request.getEventType(), newlyAcquired.size());

        return BadgeCheckResponse.builder()
                .newlyAcquiredBadges(newlyAcquired)
                .build();
    }

    // ========================================================================
    // 이벤트 핸들러 메서드 (private)
    // ========================================================================

    /**
     * [SETTLEMENT_COMPLETED] 정산 송금 완료 시 처리.
     * 관련 뱃지: NOBLE_DUCK, ASSASSIN_DUCK, TURTLE_DUCK, NIGHTOWL_DUCK
     *
     * Pay Service에서 정산(settlements) 완료 시 호출하며,
     * 각 조건(금액, 1시간 이내, 48시간 초과, 새벽 시간대)은
     * Pay Service가 이미 판별하여 boolean 플래그로 전달한다.
     */
    private void handleSettlementCompleted(User user, BadgeCheckRequest request,
                                           List<NewlyAcquiredBadgeDto> newlyAcquired) {
        Long userId = user.getId();

        // 1. NOBLE_DUCK (귀족 덕치): 누적 정산 금액 100만 원 (단위: 만 원 → required_count=100)
        // amount는 '원' 단위로 들어오므로 10000으로 나눠서 '만 원' 단위로 변환하여 누적
        if (request.getAmount() != null && request.getAmount() > 0) {
            int incrementInManWon = request.getAmount() / 10000;
            if (incrementInManWon > 0) {
                incrementAndCheck(user, "NOBLE_DUCK", incrementInManWon, newlyAcquired);
            }
        }

        // 2. ASSASSIN_DUCK (칼입금 암살자): 1시간 이내 입금 시 +1
        if (Boolean.TRUE.equals(request.getIsAssassin())) {
            incrementAndCheck(user, "ASSASSIN_DUCK", 1, newlyAcquired);
        }

        // 3. TURTLE_DUCK (거북이덕): 48시간 초과 지연 송금 시 +1
        if (Boolean.TRUE.equals(request.getIsTurtle())) {
            incrementAndCheck(user, "TURTLE_DUCK", 1, newlyAcquired);
        }

        // 4. NIGHTOWL_DUCK (올빼미덕): 자정~새벽5시 사이 송금 시 +1
        if (Boolean.TRUE.equals(request.getIsNightOwl())) {
            incrementAndCheck(user, "NIGHTOWL_DUCK", 1, newlyAcquired);
        }
    }

    /**
     * [ROOM_JOINED] 모임방 참여(입장) 시 처리.
     * 관련 뱃지: INSSA_DUCK, ALLROUNDER_DUCK, INVITE_MASTER
     *
     * Pay Service에서 방 참여 이벤트 발생 시 호출한다.
     * - INSSA_DUCK: 무조건 +1 (참여 자체가 카운트)
     * - ALLROUNDER_DUCK: 해당 유저가 처음 참여하는 카테고리면 +1
     * - INVITE_MASTER: 초대 링크로 들어온 경우, 링크 생성자(inviterId)의 카운트 +1
     */
    private void handleRoomJoined(User user, BadgeCheckRequest request,
                                  List<NewlyAcquiredBadgeDto> newlyAcquired) {
        // 1. INSSA_DUCK (인싸덕): 참여 횟수 +1
        incrementAndCheck(user, "INSSA_DUCK", 1, newlyAcquired);

        // 2. ALLROUNDER_DUCK (팔방미인덕): 새로운 카테고리 참여 시 +1
        if (Boolean.TRUE.equals(request.getIsNewCategory())) {
            incrementAndCheck(user, "ALLROUNDER_DUCK", 1, newlyAcquired);
        }

        // 3. INVITE_MASTER (초대 마스터): 초대 링크 생성자의 카운트 +1
        // 주의: 카운트를 올려야 할 대상이 '참여자'가 아닌 '초대한 사람(inviterId)'임
        if (request.getInviterId() != null) {
            User inviter = userRepository.findByIdAndDeletedAtIsNull(request.getInviterId())
                    .orElse(null);
            if (inviter != null) {
                incrementAndCheck(inviter, "INVITE_MASTER", 1, newlyAcquired);
            }
        }
    }

    /**
     * [ROOM_CREATED] 모임방 개설(방장) 시 처리.
     * 관련 뱃지: ALLEY_BOSS, INSSA_DUCK
     *
     * Pay Service에서 방 생성 이벤트 발생 시 호출한다.
     * - ALLEY_BOSS: 방장 횟수 +1
     * - INSSA_DUCK: 방 생성도 '참여'이므로 +1
     */
    private void handleRoomCreated(User user, BadgeCheckRequest request,
                                   List<NewlyAcquiredBadgeDto> newlyAcquired) {
        // 1. ALLEY_BOSS (골목대장덕): 방장 횟수 +1
        incrementAndCheck(user, "ALLEY_BOSS", 1, newlyAcquired);

        // 2. INSSA_DUCK (인싸덕): 방 생성도 참여이므로 +1
        incrementAndCheck(user, "INSSA_DUCK", 1, newlyAcquired);
    }

    /**
     * [EXPENSE_OCR_ADDED] OCR 영수증 결제 등록 시 처리.
     * 관련 뱃지: SCANNER_DUCK
     *
     * Pay Service에서 OCR 입력 방식(input_type='OCR')으로 결제를 등록할 때 호출한다.
     */
    private void handleExpenseOcrAdded(User user, List<NewlyAcquiredBadgeDto> newlyAcquired) {
        // SCANNER_DUCK (스캐너덕): OCR 사용 횟수 +1
        incrementAndCheck(user, "SCANNER_DUCK", 1, newlyAcquired);
    }

    /**
     * [ACCOUNT_REGISTERED] 계좌 등록 완료 시 처리.
     * 관련 뱃지: MANSOUR_DUCK
     *
     * Core Service 내부에서 계좌 등록 성공 시 호출한다.
     * 누적이 아닌 '현재 계좌 수'로 덮어쓰기하는 동기화 방식.
     * → 계좌 삭제 시에도 이 API를 호출하면 카운트가 자동 감소.
     */
    private void handleAccountRegistered(User user, BadgeCheckRequest request,
                                         List<NewlyAcquiredBadgeDto> newlyAcquired) {
        if (request.getTotalAccounts() == null) {
            return;
        }

        // MANSOUR_DUCK (만수르덕): 현재 계좌 수로 진행도 덮어쓰기
        setAndCheck(user, "MANSOUR_DUCK", request.getTotalAccounts(), newlyAcquired);
    }

    // ========================================================================
    // 공통 유틸리티 메서드
    // ========================================================================

    /**
     * 뱃지 진행도를 increment만큼 증가시키고, 목표 도달 시 뱃지를 부여한다.
     * 이미 획득한 뱃지면 건너뛴다.
     *
     * @param user          대상 사용자
     * @param badgeCode     뱃지 코드 (ex: "NOBLE_DUCK")
     * @param increment     증가시킬 값
     * @param newlyAcquired 새로 획득한 뱃지를 담을 리스트
     */
    private void incrementAndCheck(User user, String badgeCode, int increment,
                                   List<NewlyAcquiredBadgeDto> newlyAcquired) {
        Badge badge = badgeRepository.findByCode(badgeCode).orElse(null);
        if (badge == null) {
            // 뱃지 마스터 데이터가 없거나 Soft Delete 된 경우 → 무시
            log.warn("[BADGE-02] 뱃지 코드 '{}'를 찾을 수 없습니다. 건너뜁니다.", badgeCode);
            return;
        }

        // 이미 획득한 뱃지인지 확인 → 획득했으면 진행도 갱신 불필요
        if (userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
            return;
        }

        // 진행도 조회 또는 신규 생성
        BadgeProgress progress = getOrCreateProgress(user, badge);

        // current_count를 increment만큼 증가
        progress.updateProgress(progress.getCurrentCount() + increment);

        // 목표 달성 여부 확인 → 달성 시 뱃지 부여
        checkAndAward(user, badge, progress, newlyAcquired);
    }

    /**
     * 뱃지 진행도를 특정 값으로 덮어쓰고(Set), 목표 도달 시 뱃지를 부여한다.
     * MANSOUR_DUCK처럼 '현재 상태'를 그대로 반영하는 경우에 사용.
     */
    private void setAndCheck(User user, String badgeCode, int value,
                             List<NewlyAcquiredBadgeDto> newlyAcquired) {
        Badge badge = badgeRepository.findByCode(badgeCode).orElse(null);
        if (badge == null) {
            log.warn("[BADGE-02] 뱃지 코드 '{}'를 찾을 수 없습니다. 건너뜁니다.", badgeCode);
            return;
        }

        // 이미 획득한 뱃지인지 확인
        if (userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badge.getId())) {
            return;
        }

        // 진행도 조회 또는 신규 생성 후 값 덮어쓰기
        BadgeProgress progress = getOrCreateProgress(user, badge);
        progress.updateProgress(value);

        // 목표 달성 여부 확인
        checkAndAward(user, badge, progress, newlyAcquired);
    }

    /**
     * 사용자+뱃지 조합의 진행도를 조회하고, 없으면 새로 생성한다.
     */
    private BadgeProgress getOrCreateProgress(User user, Badge badge) {
        return badgeProgressRepository.findByUserIdAndBadgeId(user.getId(), badge.getId())
                .orElseGet(() -> badgeProgressRepository.save(
                        BadgeProgress.builder()
                                .user(user)
                                .badge(badge)
                                .currentCount(0)
                                .build()
                ));
    }

    /**
     * 진행도가 목표에 도달했는지 확인하고, 도달 시 뱃지를 부여한다.
     *
     * [획득 조건]: current_count >= required_count
     * [부여 방식]: user_badges에 INSERT → (user_id, badge_id) UK로 중복 방지
     * [알림]:      is_read = false로 저장 → 프론트에서 팝업/빨간점 표시 가능
     */
    private void checkAndAward(User user, Badge badge, BadgeProgress progress,
                               List<NewlyAcquiredBadgeDto> newlyAcquired) {
        if (progress.getCurrentCount() >= badge.getRequiredCount()) {
            // 뱃지 획득! user_badges에 저장
            UserBadge userBadge = UserBadge.builder()
                    .user(user)
                    .badge(badge)
                    .isRead(false) // 새로 획득한 뱃지는 아직 미확인 상태
                    .build();
            userBadgeRepository.save(userBadge);

            log.info("[BADGE-02] 🎉 뱃지 획득! userId={}, badgeCode={}, badgeName={}",
                    user.getId(), badge.getCode(), badge.getName());

            // 응답 리스트에 추가
            newlyAcquired.add(NewlyAcquiredBadgeDto.builder()
                    .id(badge.getId())
                    .code(badge.getCode())
                    .name(badge.getName())
                    .imageUrl(badge.getImageUrl())
                    .acquiredAt(userBadge.getAcquiredAt())
                    .build());

            // TODO: 추후 FCM 푸시 알림 발송 로직 추가
            // notificationMessageService.sendBadgeAcquiredMessage(userId, badge);
        }
    }
}
