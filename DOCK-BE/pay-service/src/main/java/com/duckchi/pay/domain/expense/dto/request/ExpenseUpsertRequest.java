package com.duckchi.pay.domain.expense.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
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
@Schema(description = "결제 등록/수정 요청")
public class ExpenseUpsertRequest {

    @NotNull(message = "모임 회차 ID는 필수입니다.")
    @Schema(description = "모임 회차 식별자", example = "1")
    private Long roomSessionId;

    @NotBlank(message = "결제 제목은 필수입니다.")
    @Schema(description = "결제 제목", example = "저녁 식사")
    private String title;

    @NotNull(message = "총 결제 금액은 필수입니다.")
    @Schema(description = "총 결제 금액", example = "50000")
    private Integer totalAmount;

    @Schema(description = "실제 결제 일시")
    private LocalDateTime paidAt;

    @Schema(description = "영수증 이미지 URL", example = "https://cdn.example.com/receipts/1.jpg")
    private String receiptImageUrl;

    @NotBlank(message = "입력 방식은 필수입니다.")
    @Schema(description = "입력 방식(MANUAL, ACCOUNT_HISTORY, OCR)", example = "MANUAL")
    private String inputType;

    @NotEmpty(message = "최소 한 명 이상의 결제 참여자가 필요합니다.")
    @Schema(description = "결제 참여자 분담 정보")
    private List<ParticipantSplitRequest> participants;

    @Schema(description = "메뉴별 분담 정보")
    private List<ItemUpsertRequest> items;

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "결제 참여자 분담 정보")
    public static class ParticipantSplitRequest {

        @NotNull(message = "사용자 ID는 필수입니다.")
        @Schema(description = "사용자 식별자", example = "1")
        private Long userId;

        @NotNull(message = "분담 금액은 필수입니다.")
        @Schema(description = "참여자의 분담 금액", example = "15000")
        private Integer splitAmount;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "메뉴별 분담 정보")
    public static class ItemUpsertRequest {

        @Schema(description = "메뉴 이름", example = "삼겹살 2인분")
        private String name;

        @NotNull(message = "메뉴 총액은 필수입니다.")
        @Schema(description = "해당 메뉴 총액", example = "36000")
        private Integer totalAmount;

        @NotNull(message = "메뉴 수량은 필수입니다.")
        @Schema(description = "메뉴 수량", example = "2")
        private Integer quantity;

        @Schema(description = "메뉴 참여자 분담 정보")
        private List<ItemSplitRequest> splits;
    }

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "메뉴 참여자 분담 정보")
    public static class ItemSplitRequest {

        @NotNull(message = "사용자 ID는 필수입니다.")
        @Schema(description = "사용자 식별자", example = "2")
        private Long userId;

        @NotNull(message = "메뉴 분담 금액은 필수입니다.")
        @Schema(description = "해당 메뉴 분담 금액", example = "12000")
        private Integer splitAmount;

        @NotNull(message = "메뉴 수량은 필수입니다.")
        @Schema(description = "해당 메뉴 수량", example = "1")
        private Integer quantity;
    }
}
