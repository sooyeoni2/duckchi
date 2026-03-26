package com.duckchi.pay.domain.expense.service;

import com.duckchi.pay.domain.expense.dto.response.ExpenseOcrDraftResponse;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.infra.ocr.OcrClient;
import com.duckchi.pay.infra.ocr.dto.OcrRequest;
import com.duckchi.pay.infra.ocr.dto.OcrResponse;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StopWatch;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
/**
 * 영수증 OCR 서비스 구현체.
 * 외부 OCR 응답을 결제 등록용 초안 구조로 정규화하는 역할.
 */
public class ExpenseOcrServiceImpl implements ExpenseOcrService {

    private final OcrClient ocrClient;

    // 정규식 엔진의 반복 컴파일 오버헤드를 방지하기 위한 캐싱
    private static final Pattern DIGITS_PATTERN = Pattern.compile("\\D");

    @Value("${ocr.naver.secret}")
    private String ocrSecret;

    @Override
    /**
     * 영수증 OCR 초안 생성 로직 (S3 URL 기반).
     * S3에 업로드된 이미지 URL을 통해 OCR 분석 수행 후 결과를 정규화함.
     */
    public ExpenseOcrDraftResponse analyzeReceipt(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        StopWatch stopWatch = new StopWatch("OCR Analysis Pipeline");
        OcrResponse response;

        try {
            stopWatch.start("Clova API Call");
            response = ocrClient.callReceiptOcr(ocrSecret, buildRequestByUrl(imageUrl));
            stopWatch.stop();
            log.info("OCR API Call Finished. Latency: {}ms", stopWatch.getLastTaskTimeMillis());
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("네이버 클로바 OCR 호출에 실패했습니다.", e);
            throw new CustomException(ErrorCode.OCR_API_ERROR);
        }

        stopWatch.start("Data Normalization");
        ExpenseOcrDraftResponse draft = toDraftResponse(response);
        stopWatch.stop();

        log.info("OCR Pipeline Completed. Total: {}ms, Normalization: {}ms", 
                stopWatch.getTotalTimeMillis(), stopWatch.getLastTaskTimeMillis());

        return draft;
    }

    @Override
    /**
     * OCR 원본 응답 조회 로직 (S3 URL 기반).
     */
    public JsonNode analyzeReceiptRaw(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }

        try {
            return ocrClient.callReceiptOcrRaw(ocrSecret, buildRequestByUrl(imageUrl));
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("OCR 원본 응답 조회에 실패했습니다.", e);
            throw new CustomException(ErrorCode.OCR_API_ERROR);
        }
    }

    /**
     * OCR 요청 DTO 생성 로직 (URL 기반).
     */
    private OcrRequest buildRequestByUrl(String imageUrl) {
        return OcrRequest.builder()
                .version("V2")
                .requestId(UUID.randomUUID().toString())
                .timestamp(System.currentTimeMillis())
                .images(List.of(
                        OcrRequest.ImageRequest.builder()
                                .format(resolveImageFormatByUrl(imageUrl))
                                .name("receipt_" + UUID.randomUUID().toString().substring(0, 8))
                                .url(imageUrl)
                                .build()
                ))
                .build();
    }

    /**
     * OCR 응답 초안 변환 로직.
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

    private String resolveTitle(OcrResponse.Result result) {
        String storeName = null;
        if (result.getStoreInfo() != null) {
            storeName = extractText(result.getStoreInfo().getName());
        }

        return StringUtils.hasText(storeName) ? storeName : "영수증 정산";
    }

    private LocalDateTime extractPaidAt(OcrResponse.Result result) {
        OcrResponse.PaymentInfo paymentInfo = result.getPaymentInfo();
        if (paymentInfo == null) {
            return null;
        }

        try {
            Integer year = null, month = null, day = null;
            Integer hour = null, minute = null, second = 0; // 초는 기본값 0

            // 1. 날짜 추출 (Formatted 데이터 우선)
            OcrResponse.DateInfo dateInfo = paymentInfo.getDate();
            if (dateInfo != null && dateInfo.getFormatted() != null) {
                OcrResponse.FormattedDate fd = dateInfo.getFormatted();
                year = parsePositiveInt(fd.getYear());
                month = parsePositiveInt(fd.getMonth());
                day = parsePositiveInt(fd.getDay());
            }

            // 2. 시간 추출 (Formatted 데이터 우선)
            OcrResponse.TimeInfo timeInfo = paymentInfo.getTime();
            if (timeInfo != null && timeInfo.getFormatted() != null) {
                OcrResponse.FormattedTime ft = timeInfo.getFormatted();
                hour = parseNonNegativeInt(ft.getHour());
                minute = parseNonNegativeInt(ft.getMinute());
                Integer parsedSecond = parseNonNegativeInt(ft.getSecond());
                if (parsedSecond != null) second = parsedSecond;
            }

            // 3. 날짜 Fallback (텍스트 파싱)
            if (year == null || month == null || day == null) {
                String dateText = dateInfo != null ? dateInfo.getText() : null;
                String dateDigits = extractDigits(dateText);
                if (dateDigits.length() == 8) {
                    year = Integer.parseInt(dateDigits.substring(0, 4));
                    month = Integer.parseInt(dateDigits.substring(4, 6));
                    day = Integer.parseInt(dateDigits.substring(6, 8));
                }
            }

            // 4. 시간 Fallback (텍스트 파싱)
            if (hour == null || minute == null) {
                String timeText = timeInfo != null ? timeInfo.getText() : null;
                String timeDigits = extractDigits(timeText);
                if (timeDigits.length() >= 4) {
                    hour = Integer.parseInt(timeDigits.substring(0, 2));
                    minute = Integer.parseInt(timeDigits.substring(2, 4));
                    if (timeDigits.length() >= 6) {
                        second = Integer.parseInt(timeDigits.substring(4, 6));
                    }
                }
            }

            // [사용자 피드백 반영] 날짜나 시간 정보가 하나라도 부족하면 null 반환 (부정확한 데이터 방지)
            if (year == null || month == null || day == null || hour == null || minute == null) {
                return null;
            }

            return LocalDateTime.of(year, month, day, hour, minute, second);
        } catch (Exception e) {
            log.info("OCR 결제 일시 파싱 중 예외 발생: {}", e.getMessage());
            return null;
        }
    }

    private String resolveImageFormatByUrl(String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) return "jpg";
        String lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.endsWith(".png")) return "png";
        if (lowerUrl.endsWith(".pdf")) return "pdf";
        return "jpg";
    }

    private String extractText(OcrResponse.TextInfo textInfo) {
        return textInfo != null ? textInfo.getText() : null;
    }

    private String extractPriceText(OcrResponse.PriceInfo priceInfo) {
        if (priceInfo == null || priceInfo.getPrice() == null) {
            return null;
        }
        OcrResponse.PriceDetails details = priceInfo.getPrice();
        // formatted value가 있으면 우선 사용 (콤마 등이 제거된 순수 숫자일 확률 높음)
        if (details.getFormatted() != null && StringUtils.hasText(details.getFormatted().getValue())) {
            return details.getFormatted().getValue();
        }
        return details.getText();
    }

    private String extractDigits(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        // 컴파일된 패턴 재사용으로 성능 최적화
        return DIGITS_PATTERN.matcher(value).replaceAll("");
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

    private Integer parseNonNegativeInt(String value) {
        String digits = extractDigits(value);
        if (!StringUtils.hasText(digits)) {
            return null;
        }

        try {
            int parsed = Integer.parseInt(digits);
            return parsed >= 0 ? parsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer resolveQuantity(String quantityText) {
        Integer parsed = parsePositiveInt(quantityText);
        return parsed != null ? parsed : 1;
    }
}
