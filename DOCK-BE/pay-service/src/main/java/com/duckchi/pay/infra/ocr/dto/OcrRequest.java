package com.duckchi.pay.infra.ocr.dto;

import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 네이버 클로바 OCR 요청 DTO다.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class OcrRequest {
    private String version;
    private String requestId;
    private long timestamp;
    private List<ImageRequest> images;

    @Getter
    @Builder
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    public static class ImageRequest {
        private String format;
        private String name;
        private String url;
        private String data;
    }
}
