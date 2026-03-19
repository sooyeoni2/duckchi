package com.duckchi.pay.domain.expense.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
@Schema(description = "OCR 분석으로 생성된 결제 초안")
public class ExpenseOcrDraftResponse {

    @Schema(description = "상호명 또는 결제 제목", example = "고기집")
    private String title;

    @Schema(description = "OCR이 인식한 총 결제 금액", example = "150000")
    private Integer totalAmount;

    @Schema(description = "OCR이 인식한 결제 일시")
    private LocalDateTime paidAt;

    @Schema(description = "OCR로 인식한 품목 목록")
    private List<OcrItemResponse> items;

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    @Schema(description = "OCR 인식 품목")
    public static class OcrItemResponse {

        @Schema(description = "품목명", example = "삼겹살")
        private String name;

        @Schema(description = "품목 총액", example = "60000")
        private Integer totalAmount;

        @Schema(description = "수량", example = "1")
        private Integer quantity;
    }
}
