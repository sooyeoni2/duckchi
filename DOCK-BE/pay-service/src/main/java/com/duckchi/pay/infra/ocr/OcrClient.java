package com.duckchi.pay.infra.ocr;

import com.duckchi.pay.infra.ocr.dto.OcrRequest;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * 네이버 클로바 OCR API와 통신하기 위한 Feign Client이다.
 */
@FeignClient(name = "ocr-client", url = "${ocr.naver.invoke-url}")
public interface OcrClient {

    /**
     * 영수증 이미지를 분석하여 텍스트 데이터를 추출한다.
     * @param secretKey 네이버 OCR 시크릿 키 (X-OCR-SECRET 헤더)
     * @param request OCR 분석 요청 데이터
     * @return OCR 분석 결과 응답 데이터
     */
    @PostMapping
    OcrResponse callReceiptOcr(
            @RequestHeader("X-OCR-SECRET") String secretKey,
            @RequestBody OcrRequest request
    );
}
