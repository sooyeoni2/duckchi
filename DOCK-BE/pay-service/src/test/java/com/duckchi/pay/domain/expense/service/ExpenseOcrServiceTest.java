package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.ocr.OcrClient;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseOcrServiceTest {

    @InjectMocks
    private ExpenseOcrServiceImpl expenseOcrService;

    @Mock
    private OcrClient ocrClient;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(expenseOcrService, "ocrSecret", "test-secret");
    }

    @Test
    @DisplayName("영수증 OCR 분석 성공 시 결제 초안을 반환한다")
    void analyzeReceiptSuccess() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                "image/jpeg",
                "sample".getBytes()
        );

        when(ocrClient.callReceiptOcr(eq("test-secret"), any())).thenReturn(successResponse());

        ExpenseOcrDraftResponse result = expenseOcrService.analyzeReceipt(image);

        assertThat(result.getTitle()).isEqualTo("덕치식당");
        assertThat(result.getTotalAmount()).isEqualTo(150000);
        assertThat(result.getPaidAt()).isEqualTo(LocalDateTime.of(2026, 3, 18, 14, 15, 0));
        assertThat(result.getItems()).hasSize(2);
        assertThat(result.getItems().get(0).getName()).isEqualTo("삼겹살");
        assertThat(result.getItems().get(0).getTotalAmount()).isEqualTo(60000);
        assertThat(result.getItems().get(0).getQuantity()).isEqualTo(2);
    }

    @Test
    @DisplayName("OCR 인식 결과가 실패면 예외를 던진다")
    void analyzeReceiptFailure() {
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "receipt.jpg",
                "image/jpeg",
                "sample".getBytes()
        );

        OcrResponse failureResponse = OcrResponse.builder()
                .images(List.of(new OcrResponse.ImageResponse(
                        "uid",
                        "receipt",
                        "FAILURE",
                        "failed",
                        null
                )))
                .build();

        when(ocrClient.callReceiptOcr(eq("test-secret"), any())).thenReturn(failureResponse);

        assertThatThrownBy(() -> expenseOcrService.analyzeReceipt(image))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OCR_ANALYSIS_FAILED);
    }

    private OcrResponse successResponse() {
        return OcrResponse.builder()
                .images(List.of(new OcrResponse.ImageResponse(
                        "uid",
                        "receipt",
                        "SUCCESS",
                        "ok",
                        new OcrResponse.Receipt(
                                new OcrResponse.Result(
                                        new OcrResponse.StoreInfo(new OcrResponse.TextInfo("덕치식당")),
                                        new OcrResponse.PaymentInfo(
                                                new OcrResponse.TextInfo("2026-03-18"),
                                                new OcrResponse.TextInfo("14:15"),
                                                new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("150000"))
                                        ),
                                        List.of(new OcrResponse.SubResult(List.of(
                                                new OcrResponse.Item(
                                                        new OcrResponse.TextInfo("삼겹살"),
                                                        new OcrResponse.TextInfo("2"),
                                                        new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("60000"))
                                                ),
                                                new OcrResponse.Item(
                                                        new OcrResponse.TextInfo("소주"),
                                                        new OcrResponse.TextInfo("5"),
                                                        new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("15000"))
                                                )
                                        )))
                                )
                        )
                )))
                .build();
    }
}
