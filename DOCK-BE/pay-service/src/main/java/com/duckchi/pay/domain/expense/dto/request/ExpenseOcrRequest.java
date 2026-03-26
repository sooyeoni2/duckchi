package com.duckchi.pay.domain.expense.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * OCR 분석 요청 DTO.
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Schema(description = "OCR 분석 요청 정보")
public class ExpenseOcrRequest {

    @NotBlank(message = "영수증 이미지 URL은 필수입니다.")
    @Schema(description = "S3에 업로드된 영수증 이미지 URL", example = "https://s3.amazonaws.com/bucket/receipt.jpg")
    private String imageUrl;
}
