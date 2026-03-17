package com.duckchi.core.infra.finance;

import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class FinanceExceptionParser {
    private final ObjectMapper objectMapper;

    // 1원 송금 금융망 API 응답 파싱
    public CustomException parseOpenAccountAuthException(FeignException ex) {
        String responseBody = ex.contentUTF8();

        try {
            JsonNode root = objectMapper.readTree(responseBody);

            String responseCode;
            String responseMessage;

            if (root.has("Header")) {
                JsonNode headerNode = root.path("Header");
                responseCode = headerNode.path("responseCode").asText();
                responseMessage = headerNode.path("responseMessage").asText();
            } else {
                responseCode = root.path("responseCode").asText();
                responseMessage = root.path("responseMessage").asText();
            }

            String message = (responseMessage == null || responseMessage.isBlank())
                    ? ErrorCode.ACCOUNT_VERIFICATION_FAILED.getMsg()
                    : responseMessage;

            return switch (responseCode) {
                case "A1001", "A1003", "A1089" -> new CustomException(
                        message,
                        ErrorCode.ACCOUNT_INVALID
                );

                case "H1000", "H1001", "H1002", "H1003", "H1004",
                     "H1005", "H1006", "H1007", "H1008", "H1010",
                     "Q1000", "Q1001" -> new CustomException(
                        message,
                        ErrorCode.ACCOUNT_VERIFICATION_FAILED
                );

                default -> new CustomException(
                        message,
                        ErrorCode.ACCOUNT_VERIFICATION_FAILED
                );
            };
        } catch (Exception parseException) {
            return new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
        }
    }
    // 1원 송금 검증 금융망API응답 파싱
    public CustomException parseCheckAuthCodeException(FeignException ex) {
        String responseBody = ex.contentUTF8();
        log.warn("Finance API call failed. status={}, body={}", ex.status(), responseBody);

        try {
            JsonNode root = objectMapper.readTree(responseBody);

            String responseCode;
            String responseMessage;

            if (root.has("Header")) {
                JsonNode headerNode = root.path("Header");
                responseCode = headerNode.path("responseCode").asText();
                responseMessage = headerNode.path("responseMessage").asText();
            } else {
                responseCode = root.path("responseCode").asText();
                responseMessage = root.path("responseMessage").asText();
            }

            return switch (responseCode) {
                case "A1086" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_NOT_ISSUED);
                case "A1087" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_EXPIRED);
                case "A1088" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_MISMATCH);
                case "A1089" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_TEXT_INVALID);
                case "A1090" -> new CustomException(responseMessage, ErrorCode.ACCOUNT_AUTH_CODE_INVALID);
                default -> new CustomException(
                        (responseMessage == null || responseMessage.isBlank())
                                ? ErrorCode.ACCOUNT_VERIFICATION_FAILED.getMsg()
                                : responseMessage,
                        ErrorCode.ACCOUNT_VERIFICATION_FAILED
                );
            };
        } catch (Exception parseException) {
            log.warn("Failed to parse finance error response body", parseException);
            return new CustomException(ErrorCode.ACCOUNT_VERIFICATION_FAILED);
        }
    }
}
