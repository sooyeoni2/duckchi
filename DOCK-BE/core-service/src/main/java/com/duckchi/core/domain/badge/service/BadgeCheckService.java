package com.duckchi.core.domain.badge.service;

import com.duckchi.core.domain.badge.dto.request.BadgeCheckRequest;
import com.duckchi.core.domain.badge.dto.response.BadgeCheckResponse;

/**
 * [BADGE-02] 뱃지 조건 체크 서비스 인터페이스.
 * 이벤트 발생 시 뱃지 진행도를 갱신하고, 조건 충족 시 뱃지를 부여한다.
 */
public interface BadgeCheckService {

    /**
     * 이벤트 기반 뱃지 조건 체크 및 획득 처리.
     *
     * @param request 이벤트 정보 및 Payload
     * @return 이번 요청에서 새로 획득한 뱃지 목록
     */
    BadgeCheckResponse checkAndAwardBadges(BadgeCheckRequest request);
}
