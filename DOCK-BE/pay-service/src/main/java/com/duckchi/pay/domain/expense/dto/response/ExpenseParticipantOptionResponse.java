package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 결제 참여자 선택 옵션 DTO.
 * 결제안 생성 화면의 참여자 선택 목록 구성 목적.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "결제 참여자 선택용 사용자 정보")
public class ExpenseParticipantOptionResponse {

    @Schema(description = "사용자 식별자", example = "1")
    private Long userId;

    @Schema(description = "사용자 이름", example = "강산천")
    private String userName;

    @Schema(description = "사용자 태그", example = "#1A3")
    private String userTag;

    @Schema(
            description = "프로필 이미지 URL",
            example = "https://duckchi.s3.ap-northeast-2.amazonaws.com/profiles/user-1.png"
    )
    private String profileImageUrl;
}
