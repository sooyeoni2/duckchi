package com.duckchi.core.domain.badge.service;

import com.duckchi.core.domain.badge.entity.Badge;
import com.duckchi.core.domain.badge.entity.BadgeProgress;
import com.duckchi.core.domain.badge.entity.UserBadge;
import com.duckchi.core.domain.badge.repository.BadgeProgressRepository;
import com.duckchi.core.domain.badge.repository.BadgeRepository;
import com.duckchi.core.domain.badge.repository.UserBadgeRepository;
import com.duckchi.core.domain.user.dto.response.UserProfileBadgeResponse;
import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.duckchi.core.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeServiceImpl implements BadgeService {

    private final UserRepository userRepository;
    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final BadgeProgressRepository badgeProgressRepository;

    @Override
    public UserProfileBadgeResponse getBadges(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 전체 뱃지 목록
        List<Badge> allBadges = badgeRepository.findAllByDeletedAtIsNull();

        // 획득한 뱃지
        List<UserBadge> userBadges = userBadgeRepository.findAllByUserId(userId);
        Set<Long> acquiredBadgeIds = userBadges.stream()
                .map(UserBadge::getBadgeId)
                .collect(Collectors.toSet());

        // 진행도 맵 (badgeId -> currentCount)
        Map<Long, Integer> progressMap = badgeProgressRepository.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(BadgeProgress::getBadgeId, BadgeProgress::getCurrentCount));

        // 획득한 뱃지 매핑
        Map<Long, UserBadge> userBadgeMap = userBadges.stream()
                .collect(Collectors.toMap(UserBadge::getBadgeId, ub -> ub));

        List<UserProfileBadgeResponse.AcquiredBadge> acquiredBadges = allBadges.stream()
                .filter(badge -> acquiredBadgeIds.contains(badge.getId()))
                .map(badge -> UserProfileBadgeResponse.AcquiredBadge.builder()
                        .id(badge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .acquiredAt(userBadgeMap.get(badge.getId()).getAcquiredAt())
                        .build())
                .toList();

        List<UserProfileBadgeResponse.LockedBadge> lockedBadges = allBadges.stream()
                .filter(badge -> !acquiredBadgeIds.contains(badge.getId()))
                .map(badge -> UserProfileBadgeResponse.LockedBadge.builder()
                        .id(badge.getId())
                        .code(badge.getCode())
                        .name(badge.getName())
                        .description(badge.getDescription())
                        .requiredCount(badge.getRequiredCount())
                        .currentCount(progressMap.getOrDefault(badge.getId(), 0))
                        .build())
                .toList();

        return UserProfileBadgeResponse.builder()
                .acquiredBadges(acquiredBadges)
                .lockedBadges(lockedBadges)
                .build();
    }
}
