package com.duckchi.core.domain.user.service;

import com.duckchi.core.domain.user.dto.response.UserFinanceProfileResponse;
import com.duckchi.core.domain.user.dto.response.UserProfileSnapshotResponse;
import java.util.List;

/**
 * 내부 서비스 간 통신을 위한 사용자 조회 인터페이스다.
 */
public interface UserInternalService {

    /**
     * 사용자의 금융 프로필(SSAFY 유저 키, 계좌번호)을 조회한다.
     */
    UserFinanceProfileResponse getUserFinanceProfile(Long userId);

    /**
     * 여러 사용자 ID에 대한 스냅샷용 프로필 정보를 조회한다.
     */
    List<UserProfileSnapshotResponse> getUserProfiles(List<Long> userIds);
}
