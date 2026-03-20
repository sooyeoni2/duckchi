package com.duckchi.pay.domain.expense.dto.external;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * core-service 내부 API로부터 전달받는 사용자 금융 프로필 DTO이다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFinanceProfileResponse {
    private String ssafyUserKey;
    private String accountNo;
}
