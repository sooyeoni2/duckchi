package com.duckchi.pay.domain.expense.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.ocr.OcrClient;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ExpenseOcrServiceTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @InjectMocks
    private ExpenseOcrServiceImpl expenseOcrService;

    @Mock
    private OcrClient ocrClient;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(expenseOcrService, "ocrSecret", "test-secret");
    }

    @Test
    @DisplayName("OCR 성공 응답을 결제 초안으로 변환함 (Formatted 데이터 활용)")
    void analyzeReceiptSuccess() {
        String imageUrl = "https://s3.amazonaws.com/receipt.jpg";

        when(ocrClient.callReceiptOcr(eq("test-secret"), any())).thenReturn(successResponse());

        ExpenseOcrDraftResponse result = expenseOcrService.analyzeReceipt(imageUrl);

        assertThat(result.getTitle()).isEqualTo("덕치정육식당");
        assertThat(result.getTotalAmount()).isEqualTo(150000);
        // Formatted 데이터 (2026, 3, 18, 14, 15, 0) 기반 파싱 확인
        assertThat(result.getPaidAt()).isEqualTo(LocalDateTime.of(2026, 3, 18, 14, 15, 0));
        assertThat(result.getItems()).hasSize(2);
    }

    @Test
    @DisplayName("날짜/시간 정보가 부족하면 paidAt은 null을 반환함")
    void analyzeReceiptWithMissingDateTime() {
        String imageUrl = "https://s3.amazonaws.com/receipt.jpg";
        OcrResponse response = OcrResponse.builder()
                .images(List.of(new OcrResponse.ImageResponse(
                        "uid", "receipt", "SUCCESS", "ok",
                        new OcrResponse.Receipt(new OcrResponse.Result(
                                new OcrResponse.StoreInfo(new OcrResponse.TextInfo("식당")),
                                new OcrResponse.PaymentInfo(null, null, null), // 날짜/시간 없음
                                List.of(),
                                new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("10000", null))
                        ))
                )))
                .build();

        when(ocrClient.callReceiptOcr(eq("test-secret"), any())).thenReturn(response);

        ExpenseOcrDraftResponse result = expenseOcrService.analyzeReceipt(imageUrl);

        assertThat(result.getPaidAt()).isNull();
        assertThat(result.getTotalAmount()).isEqualTo(10000);
    }

    @Test
    @DisplayName("OCR 실패 응답이면 분석 실패 예외를 던짐")
    void analyzeReceiptFailure() {
        String imageUrl = "https://s3.amazonaws.com/receipt.jpg";

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

        assertThatThrownBy(() -> expenseOcrService.analyzeReceipt(imageUrl))
                .isInstanceOf(CustomException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OCR_ANALYSIS_FAILED);
    }

    @Test
    @DisplayName("OCR 원본 응답을 그대로 반환함")
    void analyzeReceiptRawSuccess() {
        String imageUrl = "https://s3.amazonaws.com/receipt.jpg";

        JsonNode rawResponse = OBJECT_MAPPER.createObjectNode();
        ((com.fasterxml.jackson.databind.node.ObjectNode) rawResponse).put("version", "V2");
        ((com.fasterxml.jackson.databind.node.ObjectNode) rawResponse)
                .putArray("images")
                .addObject()
                .put("inferResult", "SUCCESS")
                .put("message", "SUCCESS")
                .put("name", "receipt_test");

        when(ocrClient.callReceiptOcrRaw(eq("test-secret"), any())).thenReturn(rawResponse);

        JsonNode result = expenseOcrService.analyzeReceiptRaw(imageUrl);

        assertThat(result.get("version").asText()).isEqualTo("V2");
        assertThat(result.get("images")).hasSize(1);
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
                                        new OcrResponse.StoreInfo(new OcrResponse.TextInfo("덕치정육식당")),
                                        new OcrResponse.PaymentInfo(
                                                new OcrResponse.DateInfo("2026-03-18", new OcrResponse.FormattedDate("2026", "03", "18")),
                                                new OcrResponse.TimeInfo("14:15", new OcrResponse.FormattedTime("14", "15", "00")),
                                                null
                                        ),
                                        List.of(new OcrResponse.SubResult(List.of(
                                                new OcrResponse.Item(
                                                        new OcrResponse.TextInfo("삼겹살"),
                                                        new OcrResponse.TextInfo("2"),
                                                        new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("60000", new OcrResponse.FormattedValue("60000")))
                                                ),
                                                new OcrResponse.Item(
                                                        new OcrResponse.TextInfo("음료"),
                                                        new OcrResponse.TextInfo("5"),
                                                        new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("15000", new OcrResponse.FormattedValue("15000")))
                                                )
                                        ))),
                                        new OcrResponse.PriceInfo(new OcrResponse.PriceDetails("150000", new OcrResponse.FormattedValue("150000")))
                                )
                        )
                )))
                .build();
    }
}
