package com.duckchi.pay.infra.ocr.dto;

import lombok.*;
import java.util.List;

/**
 * 네이버 클로바 OCR 영수증 인식 결과를 받기 위한 DTO이다.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OcrResponse {
    private String version;
    private String requestId;
    private long timestamp;
    private List<ImageResponse> images;

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class ImageResponse {
        private String uid;
        private String name;
        private String inferResult;
        private String message;
        private Receipt receipt;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class Receipt {
        private Result result;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class Result {
        private StoreInfo storeInfo;
        private PaymentInfo paymentInfo;
        private List<SubResult> subResults;
        private PriceInfo totalPrice;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class StoreInfo {
        private TextInfo name;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class PaymentInfo {
        private DateInfo date;
        private TimeInfo time;
        private PriceInfo totalPrice;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class SubResult {
        private List<Item> items;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class Item {
        private TextInfo name;
        private TextInfo count;
        private PriceInfo price;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class TextInfo {
        private String text;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class DateInfo {
        private String text;
        private FormattedDate formatted;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class FormattedDate {
        private String year;
        private String month;
        private String day;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class TimeInfo {
        private String text;
        private FormattedTime formatted;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class FormattedTime {
        private String hour;
        private String minute;
        private String second;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class PriceInfo {
        private PriceDetails price;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class PriceDetails {
        private String text; // 실제 정규화된 금액 텍스트임.
        private FormattedValue formatted;
    }

    @Getter @NoArgsConstructor @AllArgsConstructor
    public static class FormattedValue {
        private String value;
    }
}
