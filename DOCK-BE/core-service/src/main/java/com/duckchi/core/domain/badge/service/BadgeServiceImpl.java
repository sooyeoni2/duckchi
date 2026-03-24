package com.duckchi.core.domain.badge.service;

import com.duckchi.core.domain.badge.dto.response.BadgeListResponse;
import com.duckchi.core.domain.badge.dto.response.BadgeListResponse.AcquiredBadgeDto;
import com.duckchi.core.domain.badge.dto.response.BadgeListResponse.LockedBadgeDto;
import com.duckchi.core.domain.badge.dto.response.BadgeProgressResponse;
import com.duckchi.core.domain.badge.entity.Badge;
import com.duckchi.core.domain.badge.entity.BadgeProgress;
import com.duckchi.core.domain.badge.entity.UserBadge;
import com.duckchi.core.domain.badge.repository.BadgeProgressRepository;
import com.duckchi.core.domain.badge.repository.BadgeRepository;
import com.duckchi.core.domain.badge.repository.UserBadgeRepository;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 뱃지 도메인 서비스 구현체.
 * BADGE-01(목록 조회), BADGE-03(진행도 조회), BADGE-04(읽음 처리)를 구현한다.
 * BADGE-02(조건 체크)는 Kafka 이벤트 연동과 함께 추후 구현 예정.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeServiceImpl implements BadgeService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeProgressRepository badgeProgressRepository;

    /*
     * [BADGE-01] 내 전체 뱃지 목록 조회.
     *
     * 로직 흐름:
     * 1. 전체 뱃지 마스터 목록을 가져온다.
     * 2. 사용자가 획득한 뱃지 목록을 가져온다.
     * 3. 사용자의 진행도 목록을 가져온다.
     * 4. 획득 여부에 따라 acquiredBadges / lockedBadges로 분류하여 반환한다.
     */
    @Override
    public BadgeListResponse getBadgeList(Long userId) {
        // 1. 전체 뱃지 마스터 목록 조회 (Soft Delete 된 뱃지는 @SQLRestriction으로 자동 제외)
        List<Badge> allBadges = badgeRepository.findAll();

        // 2. 사용자가 획득한 뱃지 목록 조회 → badgeId 기준 Map으로 변환하여 O(1) 룩업
        List<UserBadge> userBadges = userBadgeRepository.findAllByUserId(userId);
        Map<Integer, UserBadge> acquiredMap = userBadges.stream()
                .collect(Collectors.toMap(
                        ub -> ub.getBadge().getId(),
                        ub -> ub
                ));

        // 3. 사용자의 진행도 목록 조회 → badgeId 기준 Map으로 변환
        List<BadgeProgress> progressList = badgeProgressRepository.findAllByUserId(userId);
        Map<Integer, BadgeProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        bp -> bp.getBadge().getId(),
                        bp -> bp
                ));

        // 4. 획득/미획득 분류
        List<AcquiredBadgeDto> acquiredBadges = new ArrayList<>();
        List<LockedBadgeDto> lockedBadges = new ArrayList<>();

        for (Badge badge : allBadges) {
            UserBadge userBadge = acquiredMap.get(badge.getId());

            if (userBadge != null) {
                // 획득한 뱃지: user_badges 데이터를 기반으로 구성
                acquiredBadges.add(AcquiredBadgeDto.builder()
                        .id(userBadge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .imageUrl(badge.getImageUrl())
                        .acquiredAt(userBadge.getAcquiredAt())
                        .build());
            } else {
                // 미획득 뱃지: badge_progress에서 현재 진행도를 가져오고, 없으면 0
                BadgeProgress progress = progressMap.get(badge.getId());
                int currentCount = (progress != null) ? progress.getCurrentCount() : 0;

                lockedBadges.add(LockedBadgeDto.builder()
                        .id(badge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .imageUrl(badge.getImageUrl())
                        .requiredCount(badge.getRequiredCount())
                        .currentCount(currentCount)
                        .build());
            }
        }

        return BadgeListResponse.builder()
                .acquiredBadges(acquiredBadges)
                .lockedBadges(lockedBadges)
                .build();
    }

    /*
     * [BADGE-03] 특정 미획득 뱃지의 진행도 조회.
     *
     * 로직 흐름:
     * 1. badgeCode로 뱃지 마스터를 조회한다. 없으면 BADGE-404-2 에러.
     * 2. 해당 뱃지의 사용자 진행도를 조회한다. 없으면 currentCount=0으로 반환.
     */
    @Override
    public BadgeProgressResponse getBadgeProgress(Long userId, String badgeCode) {
        // 1. 뱃지 마스터 조회
        Badge badge = badgeRepository.findByCode(badgeCode)
                .orElseThrow(() -> new CustomException(ErrorCode.BADGE_NOT_FOUND));

        // 2. 진행도 조회 (없으면 0으로 반환)
        BadgeProgress progress = badgeProgressRepository.findByUserIdAndBadgeCode(userId, badgeCode)
                .orElse(null);

        return BadgeProgressResponse.builder()
                .requiredCount(badge.getRequiredCount())
                .currentCount(progress != null ? progress.getCurrentCount() : 0)
                .lastUpdatedAt(progress != null ? progress.getLastUpdatedAt() : null)
                .build();
    }

    /**
     * [BADGE-04] 뱃지 획득 알림 읽음 처리.
     *
     * 로직 흐름:
     * 1. badgeId + userId로 user_badges 레코드를 조회한다. 없으면 BADGE-404-1 에러.
     * 2. 이미 읽음 처리된 경우 BADGE-409-1 에러.
     * 3. is_read를 true로 변경한다.
     */
    @Override
    @Transactional
    public void markBadgeAsRead(Long userId, Long badgeId) {
        // 1. user_badges 레코드 조회
        UserBadge userBadge = userBadgeRepository.findByIdAndUserId(badgeId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.BADGE_USER_NOT_FOUND));

        // 2. 이미 읽음 처리된 경우 409 에러
        if (userBadge.isAlreadyRead()) {
            throw new CustomException(ErrorCode.BADGE_ALREADY_READ);
        }

        // 3. 읽음 처리
        userBadge.markAsRead();
    }
}
