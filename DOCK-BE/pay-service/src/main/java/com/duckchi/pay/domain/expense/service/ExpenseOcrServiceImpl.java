package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.ocr.OcrClient;
import com.duckchi.pay.infra.ocr.dto.OcrRequest;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
/**
 * 영수증 OCR 서비스 구현체.
 * 외부 OCR 응답을 결제 등록용 초안 구조로 정규화하는 역할.
 */
public class ExpenseOcrServiceImpl implements ExpenseOcrService {

    private final OcrClient ocrClient;

    @Value("${ocr.naver.secret}")
    private String ocrSecret;

    @Override
    /**
     * 영수증 OCR 초안 생성 로직.
     * 이미지 검증 후 OCR 응답을 결제 초안 DTO로 변환하는 역할.
     */
    public ExpenseOcrDraftResponse analyzeReceipt(MultipartFile image) {
        validateImage(image);

        OcrResponse response;
        try {
            response = ocrClient.callReceiptOcr(ocrSecret, buildRequest(image));
            log.info("OCR Raw Response: {}", response);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("네이버 클로바 OCR 호출에 실패했습니다.", e);
            throw new CustomException(ErrorCode.OCR_API_ERROR);
        }

        return toDraftResponse(response);
    }

    @Override
    /**
     * OCR 원본 응답 조회 로직.
     * 디버깅 및 응답 구조 확인 목적의 원본 JSON 반환 역할.
     */
    public JsonNode analyzeReceiptRaw(MultipartFile image) {
        validateImage(image);

        try {
            return ocrClient.callReceiptOcrRaw(ocrSecret, buildRequest(image));
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("OCR 원본 응답 조회에 실패했습니다.", e);
            throw new CustomException(ErrorCode.OCR_API_ERROR);
        }
    }

    /**
     * 업로드 이미지 기본 검증 로직.
     * 빈 파일과 지원하지 않는 확장자 차단 역할.
     */
    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        String format = resolveImageFormat(image.getOriginalFilename());
        if (!StringUtils.hasText(format)) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }

    /**
     * OCR 요청 DTO 생성 로직.
     * 파일 내용을 base64 문자열로 변환해 외부 API 요청 형태 구성 역할.
     */
    private OcrRequest buildRequest(MultipartFile image) {
        try {
            return OcrRequest.builder()
                    .version("V2")
                    .requestId(UUID.randomUUID().toString())
                    .timestamp(System.currentTimeMillis())
                    .images(List.of(
                            OcrRequest.ImageRequest.builder()
                                    .format(resolveImageFormat(image.getOriginalFilename()))
                                    .name(resolveImageName(image.getOriginalFilename()))
                                    .data(Base64.getEncoder().encodeToString(image.getBytes()))
                                    .build()
                    ))
                    .build();
        } catch (IOException e) {
            log.error("OCR 요청 이미지 변환에 실패했습니다.", e);
            throw new CustomException(ErrorCode.OCR_ANALYSIS_FAILED);
        }
    }

    /**
     * OCR 응답 초안 변환 로직.
     * 제목, 총액, 결제 시각, 품목 목록 조합 역할.
     */
    private ExpenseOcrDraftResponse toDraftResponse(OcrResponse response) {
        OcrResponse.ImageResponse imageResponse = extractImageResponse(response);
        OcrResponse.Result result = extractResult(imageResponse);

        List<ExpenseOcrDraftResponse.OcrItemResponse> items = extractItems(result);
        Integer totalAmount = extractTotalAmount(result, items);

        if (totalAmount == null || totalAmount <= 0) {
            throw new CustomException(ErrorCode.OCR_ANALYSIS_FAILED);
        }

        return ExpenseOcrDraftResponse.builder()
                .title(resolveTitle(result))
                .totalAmount(totalAmount)
                .paidAt(extractPaidAt(result))
                .items(items)
                .build();
    }

    /**
     * OCR 성공 이미지 응답 추출 로직.
     * 실패 응답과 빈 응답 차단 역할.
     */
    private OcrResponse.ImageResponse extractImageResponse(OcrResponse response) {
        if (response == null || response.getImages() == null || response.getImages().isEmpty()) {
            throw new CustomException(ErrorCode.OCR_ANALYSIS_FAILED);
        }

        OcrResponse.ImageResponse imageResponse = response.getImages().get(0);
        if (!"SUCCESS".equalsIgnoreCase(imageResponse.getInferResult())) {
            throw new CustomException(ErrorCode.OCR_ANALYSIS_FAILED);
        }
        return imageResponse;
    }

    private OcrResponse.Result extractResult(OcrResponse.ImageResponse imageResponse) {
        if (imageResponse.getReceipt() == null || imageResponse.getReceipt().getResult() == null) {
            throw new CustomException(ErrorCode.OCR_ANALYSIS_FAILED);
        }
        return imageResponse.getReceipt().getResult();
    }

    /**
     * OCR 품목 목록 추출 로직.
     * 빈 품목명과 0원 품목 제거 역할.
     */
    private List<ExpenseOcrDraftResponse.OcrItemResponse> extractItems(OcrResponse.Result result) {
        if (result.getSubResults() == null) {
            return List.of();
        }

        return result.getSubResults().stream()
                .filter(subResult -> subResult.getItems() != null)
                .flatMap(subResult -> subResult.getItems().stream())
                .map(item -> ExpenseOcrDraftResponse.OcrItemResponse.builder()
                        .name(extractText(item.getName()))
                        .totalAmount(parsePositiveInt(extractPriceText(item.getPrice())))
                        .quantity(resolveQuantity(extractText(item.getCount())))
                        .build())
                .filter(item -> StringUtils.hasText(item.getName()))
                .filter(item -> item.getTotalAmount() != null && item.getTotalAmount() > 0)
                .toList();
    }

    /**
     * OCR 총액 추출 로직.
     * 영수증 총액 우선 사용 후 품목 합산으로 보정 역할.
     */
    private Integer extractTotalAmount(
            OcrResponse.Result result,
            List<ExpenseOcrDraftResponse.OcrItemResponse> items
    ) {
        Integer totalFromReceipt = parsePositiveInt(extractPriceText(result.getTotalPrice()));

        if (totalFromReceipt == null && result.getPaymentInfo() != null) {
            totalFromReceipt = parsePositiveInt(extractPriceText(result.getPaymentInfo().getTotalPrice()));
        }

        if (totalFromReceipt != null && totalFromReceipt > 0) {
            return totalFromReceipt;
        }

        int sum = items.stream()
                .map(ExpenseOcrDraftResponse.OcrItemResponse::getTotalAmount)
                .filter(amount -> amount != null && amount > 0)
                .mapToInt(Integer::intValue)
                .sum();

        return sum > 0 ? sum : null;
    }

    /**
     * 결제 제목 결정 로직.
     * 상호명이 없으면 기본 제목 사용 역할.
     */
    private String resolveTitle(OcrResponse.Result result) {
        String storeName = null;
        if (result.getStoreInfo() != null) {
            storeName = extractText(result.getStoreInfo().getName());
        }

        return StringUtils.hasText(storeName) ? storeName : "영수증 정산";
    }

    /**
     * 결제 시각 파싱 로직.
     * 날짜와 시각 텍스트를 LocalDateTime으로 변환하는 역할.
     */
    private LocalDateTime extractPaidAt(OcrResponse.Result result) {
        if (result.getPaymentInfo() == null) {
            return null;
        }

        String dateDigits = extractDigits(extractText(result.getPaymentInfo().getDate()));
        String timeDigits = extractDigits(extractText(result.getPaymentInfo().getTime()));

        if (dateDigits.length() != 8) {
            return null;
        }

        if (timeDigits.length() < 4) {
            return null;
        }

        try {
            int year = Integer.parseInt(dateDigits.substring(0, 4));
            int month = Integer.parseInt(dateDigits.substring(4, 6));
            int day = Integer.parseInt(dateDigits.substring(6, 8));
            int hour = Integer.parseInt(timeDigits.substring(0, 2));
            int minute = Integer.parseInt(timeDigits.substring(2, 4));
            int second = timeDigits.length() >= 6 ? Integer.parseInt(timeDigits.substring(4, 6)) : 0;
            return LocalDateTime.of(year, month, day, hour, minute, second);
        } catch (Exception e) {
            log.info("OCR 결제 일시 파싱에 실패했습니다. date={}, time={}", dateDigits, timeDigits);
            return null;
        }
    }

    private String resolveImageFormat(String originalFilename) {
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            return null;
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT);

        return switch (extension) {
            case "jpg", "jpeg" -> "jpg";
            case "png" -> "png";
            case "pdf" -> "pdf";
            default -> null;
        };
    }

    private String resolveImageName(String originalFilename) {
        if (!StringUtils.hasText(originalFilename) || !originalFilename.contains(".")) {
            return "receipt";
        }

        return originalFilename.substring(0, originalFilename.lastIndexOf('.'));
    }

    private String extractText(OcrResponse.TextInfo textInfo) {
        return textInfo != null ? textInfo.getText() : null;
    }

    private String extractPriceText(OcrResponse.PriceInfo priceInfo) {
        if (priceInfo == null || priceInfo.getPrice() == null) {
            return null;
        }
        return priceInfo.getPrice().getText();
    }

    private String extractDigits(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    private Integer parsePositiveInt(String value) {
        String digits = extractDigits(value);
        if (!StringUtils.hasText(digits)) {
            return null;
        }

        try {
            int parsed = Integer.parseInt(digits);
            return parsed > 0 ? parsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer resolveQuantity(String quantityText) {
        Integer parsed = parsePositiveInt(quantityText);
        return parsed != null ? parsed : 1;
    }
}
