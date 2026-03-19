package com.duckchi.core.domain.user.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class UserProfileBatchRequest {

    @NotEmpty(message = "조회할 사용자 ID 목록은 비어 있을 수 없습니다.")
    private List<Long> userIds;
}
