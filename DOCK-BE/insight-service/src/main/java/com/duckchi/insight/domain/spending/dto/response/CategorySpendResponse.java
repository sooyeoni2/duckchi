package com.duckchi.insight.domain.spending.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "카테고리별 지출 통계 응답")
public record CategorySpendResponse(
        @Schema(description = "카테고리명", example = "식비")
        String category,

        @Schema(description = "지출 금액", example = "45000")
        Integer amount,

        @Schema(description = "해당 월 총 지출 대비 비중 (%)", example = "69.2")
        Double percentage,

        @Schema(description = "정산 횟수 (해당 카테고리 정산 이벤트 수)", example = "3")
        Integer count
) {}