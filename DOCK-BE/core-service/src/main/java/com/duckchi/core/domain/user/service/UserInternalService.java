package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;

/**
 * 서비스 간 내부 통신을 위한 유저 도메인 서비스 인터페이스.
 */
public interface UserInternalService {
    /**
     * 유저의 금융 프로필(유저 키 + 계좌 번호) 정보를 조회함.
     */
    UserFinanceProfileResponse getUserFinanceProfile(Long userId);
}
