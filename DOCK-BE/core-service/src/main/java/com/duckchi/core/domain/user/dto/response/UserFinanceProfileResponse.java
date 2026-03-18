package com.duckchi.core.domain.user.dto.response;

import lombok.*;

/**
 * 서비스 간 내부 통신을 위한 유저 금융 프로필 응답 DTO.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFinanceProfileResponse {
    private String ssafyUserKey;  // SSAFY 금융망 유저 키
    private String accountNo;     // 유저의 등록된 주 계좌 번호
}
