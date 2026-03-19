package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "결제 참여자 선택용 사용자 정보")
public class ExpenseParticipantOptionResponse {

    @Schema(description = "사용자 식별자", example = "1")
    private Long userId;

    @Schema(description = "사용자 이름", example = "덕치")
    private String userName;

    @Schema(description = "사용자 태그", example = "#1A3")
    private String userTag;

    @Schema(description = "프로필 이미지 URL")
    private String profileImageUrl;
}
