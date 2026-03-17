package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.List;

/**
 * 결제 상세 정보 응답.
 * 원장, 참여자 요약, 품목별 상세 내역을 포함하는 계층형 구조임.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "결제 상세 정보")
public class ExpenseDetailResponse {

    @Schema(description = "결제 식별자", example = "1")
    private Long expenseId;

    @Schema(description = "결제 제목", example = "한우마당")
    private String title;

    @Schema(description = "총 결제 금액", example = "120000")
    private Integer totalAmount;

    @Schema(description = "결제자 이름", example = "강산천")
    private String payerUserName;

    @Schema(description = "결제자 식별자", example = "1")
    private Long payerUserId;

    @Schema(description = "입력 방식", example = "ACCOUNT_HISTORY")
    private String inputType;

    @Schema(description = "전체 참여자 분담 요약 리스트")
    private List<ParticipantDetail> participants;

    @Schema(description = "상세 품목별 분담 리스트")
    private List<ItemDetail> items;

    /**
     * 최종 참여자 분담 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ParticipantDetail {
        private Long userId;
        private String userName;
        private String userTag;
        private String profileImageUrl;
        private Integer splitAmount;
    }

    /**
     * 개별 품목 상세 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemDetail {
        private String name;
        private Integer totalAmount;
        private Integer quantity;
        private List<ItemParticipantDetail> itemParticipants;
    }

    /**
     * 품목별 참여자 상세 정보.
     */
    @Getter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ItemParticipantDetail {
        private Long userId;
        private String userName;
        private String userTag;
        private String profileImageUrl;
        private Integer splitAmount;
        private Integer quantity;
    }
}
