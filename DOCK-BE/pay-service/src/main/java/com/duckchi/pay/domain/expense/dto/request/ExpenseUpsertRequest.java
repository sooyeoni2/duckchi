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

/**
 * 결제 등록 및 수정 요청 DTO.
 * 결제 기본 정보, 참여자 분담 정보, 품목별 분담 정보 포함.
 */
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
    @Schema(description = "결제 제목", example = "강남 저녁 회식")
    private String title;

    @NotNull(message = "총 결제 금액은 필수입니다.")
    @Schema(description = "총 결제 금액", example = "86000")
    private Integer totalAmount;

    @Schema(description = "실제 결제 일시", example = "2026-03-20T19:30:00")
    private LocalDateTime paidAt;

    @Schema(
            description = "영수증 이미지 URL. OCR/계좌내역 기반 등록 후 보관 이미지 경로",
            example = "https://duckchi.s3.ap-northeast-2.amazonaws.com/receipts/20260320-dinner.jpg"
    )
    private String receiptImageUrl;

    @NotBlank(message = "입력 방식은 필수입니다.")
    @Schema(description = "입력 방식", example = "MANUAL", allowableValues = {"MANUAL", "ACCOUNT_HISTORY", "OCR"})
    private String inputType;

    @NotEmpty(message = "최소 한 명 이상의 결제 참여자가 필요합니다.")
    @Schema(description = "전체 참여자 분담 정보 목록")
    private List<ParticipantSplitRequest> participants;

    @Schema(description = "품목별 분담 정보 목록. 수기 입력 시 생략 가능")
    private List<ItemUpsertRequest> items;

    /**
     * 전체 결제 참여자 분담 정보 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "전체 결제 참여자 분담 정보")
    public static class ParticipantSplitRequest {

        @NotNull(message = "사용자 ID는 필수입니다.")
        @Schema(description = "사용자 식별자", example = "1")
        private Long userId;

        @NotNull(message = "분담 금액은 필수입니다.")
        @Schema(description = "참여자 분담 금액", example = "43000")
        private Integer splitAmount;
    }

    /**
     * 품목 단위 분담 정보 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "품목별 분담 정보")
    public static class ItemUpsertRequest {

        @Schema(description = "품목 이름", example = "삼겹살 2인분")
        private String name;

        @NotNull(message = "품목 총액은 필수입니다.")
        @Schema(description = "품목 총액", example = "54000")
        private Integer totalAmount;

        @NotNull(message = "품목 수량은 필수입니다.")
        @Schema(description = "품목 수량", example = "2")
        private Integer quantity;

        @Schema(description = "품목 참여자 분담 정보 목록")
        private List<ItemSplitRequest> splits;
    }

    /**
     * 품목 참여자 분담 정보 DTO.
     */
    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "품목 참여자 분담 정보")
    public static class ItemSplitRequest {

        @NotNull(message = "사용자 ID는 필수입니다.")
        @Schema(description = "사용자 식별자", example = "2")
        private Long userId;

        @NotNull(message = "품목 분담 금액은 필수입니다.")
        @Schema(description = "품목 분담 금액", example = "27000")
        private Integer splitAmount;

        @NotNull(message = "품목 수량은 필수입니다.")
        @Schema(description = "품목 수량", example = "1")
        private Integer quantity;
    }
}
