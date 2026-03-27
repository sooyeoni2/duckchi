package com.duckchi.pay.infra.ocr;

import com.duckchi.pay.infra.config.OcrFeignConfig;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

/**
 * 네이버 클로바 OCR API와 통신하기 위한 Feign Client이다.
 */
@FeignClient(name = "ocr-client", url = "${ocr.naver.invoke-url}", configuration = OcrFeignConfig.class)
public interface OcrClient {

    /**
     * 영수증 이미지 바이너리를 직접 전송하여 분석을 수행한다 (Multipart 방식).
     * @param secretKey 네이버 OCR 시크릿 키
     * @param message 분석 요청 메타데이터 (JSON)
     * @param image 이미지 바이너리 파일
     * @return OCR 분석 결과 응답 데이터
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    OcrResponse callReceiptOcrMultipart(
            @RequestHeader("X-OCR-SECRET") String secretKey,
            @RequestPart("message") String message,
            @RequestPart("file") MultipartFile image
    );

    /**
     * 영수증 이미지 바이너리를 직접 전송하여 원본 응답을 조회한다 (Multipart 방식).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    JsonNode callReceiptOcrRawMultipart(
            @RequestHeader("X-OCR-SECRET") String secretKey,
            @RequestPart("message") String message,
            @RequestPart("file") MultipartFile image
    );
}
