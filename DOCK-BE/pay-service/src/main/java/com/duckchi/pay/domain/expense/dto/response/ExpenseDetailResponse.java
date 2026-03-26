package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 결제안 상세 응답 DTO.
 * 결제 기본 정보, 참여자 분담, 품목별 분담 상세 포함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제안 상세 정보")
public class ExpenseDetailResponse {

    @Schema(description = "결제안 식별자", example = "10")
    private Long expenseId;

    @Schema(description = "결제 제목", example = "강남 저녁 회식")
    private String title;

    @Schema(description = "총 결제 금액", example = "86000")
    private Integer totalAmount;

    @Schema(description = "실제 결제 일시", example = "2026-03-20T19:30:00")
    private LocalDateTime paidAt;

    @Schema(description = "결제자 이름", example = "강산천")
    private String payerUserName;

    @Schema(description = "결제자 식별자", example = "1")
    private Long payerUserId;

    @Schema(description = "입력 방식", example = "ACCOUNT_HISTORY", allowableValues = {"MANUAL", "ACCOUNT_HISTORY", "OCR"})
    private String inputType;

    @Schema(description = "결제안 상태", example = "PENDING", allowableValues = {"PENDING", "REQUESTED", "SETTLED"})
    private String status;

    @Schema(description = "전체 참여자 분담 요약 목록")
    private List<ParticipantDetail> participants;

    @Schema(description = "품목별 분담 상세 목록")
    private List<ItemDetail> items;

    /**
     * 전체 참여자 분담 정보 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "전체 참여자 분담 정보")
    public static class ParticipantDetail {

        @Schema(description = "사용자 식별자", example = "2")
        private Long userId;

        @Schema(description = "사용자 이름", example = "이정민")
        private String userName;

        @Schema(description = "사용자 태그", example = "#2B4")
        private String userTag;

        @Schema(
                description = "프로필 이미지 URL",
                example = "https://duckchi.s3.ap-northeast-2.amazonaws.com/profiles/user-2.png"
        )
        private String profileImageUrl;

        @Schema(description = "최종 분담 금액", example = "43000")
        private Integer splitAmount;
    }

    /**
     * 품목 상세 정보 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "품목별 상세 정보")
    public static class ItemDetail {

        @Schema(description = "품목 이름", example = "삼겹살 2인분")
        private String name;

        @Schema(description = "품목 총액", example = "54000")
        private Integer totalAmount;

        @Schema(description = "품목 수량", example = "2")
        private Integer quantity;

        @Schema(description = "품목 참여자 분담 목록")
        private List<ItemParticipantDetail> itemParticipants;
    }

    /**
     * 품목 참여자 분담 상세 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "품목 참여자 분담 상세 정보")
    public static class ItemParticipantDetail {

        @Schema(description = "사용자 식별자", example = "2")
        private Long userId;

        @Schema(description = "사용자 이름", example = "이정민")
        private String userName;

        @Schema(description = "사용자 태그", example = "#2B4")
        private String userTag;

        @Schema(
                description = "프로필 이미지 URL",
                example = "https://duckchi.s3.ap-northeast-2.amazonaws.com/profiles/user-2.png"
        )
        private String profileImageUrl;

        @Schema(description = "품목 기준 분담 금액", example = "27000")
        private Integer splitAmount;

        @Schema(description = "품목 기준 수량", example = "1")
        private Integer quantity;
    }
}
