package com.duckchi.core.domain.badge.service;


import com.duckchi.core.domain.badge.dto.response.BadgeListResponse;
import com.duckchi.core.domain.badge.dto.response.BadgeProgressResponse;

/**
 * 뱃지 도메인 서비스 인터페이스.
 * BADGE-01 ~ BADGE-04 기능을 정의한다.
 */
public interface BadgeService {

    /**
     * [BADGE-01] 내 전체 뱃지 목록 조회.
     * 획득한 뱃지와 미획득 뱃지를 분리하여 반환한다.
     *
     * @param userId 요청 사용자 ID (X-User-Id 헤더)
     * @return 획득/미획득 뱃지 목록
     */
    BadgeListResponse getBadgeList(Long userId);

    /**
     * [BADGE-03] 특정 미획득 뱃지의 진행도 조회.
     *
     * @param userId    요청 사용자 ID
     * @param badgeCode 뱃지 코드 (ex: NOBLE_DUCK)
     * @return 진행도 정보 (목표 횟수, 현재 횟수, 마지막 업데이트 시간)
     */
    BadgeProgressResponse getBadgeProgress(Long userId, String badgeCode);

    /**
     * [BADGE-04] 뱃지 획득 알림 읽음 처리.
     * 획득한 뱃지의 알림을 사용자가 확인했을 때 호출한다.
     *
     * @param userId  요청 사용자 ID
     * @param badgeId 대상 user_badges.id
     */
    void markBadgeAsRead(Long userId, Long badgeId);
}
