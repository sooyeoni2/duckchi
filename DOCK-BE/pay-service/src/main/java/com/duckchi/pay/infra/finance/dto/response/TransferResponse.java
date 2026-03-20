package com.duckchi.pay.infra.finance.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.util.StringUtils;

public record TransferResponse(
        @JsonProperty("Header") FinanceResponseHeader header,
        @JsonProperty("REC") JsonNode rec
) {

    /**
     * 금융망 응답 REC 구조가 객체/배열로 가변일 수 있어 둘 다 지원한다.
     */
    public String extractTransactionUniqueNo() {
        if (rec == null || rec.isNull()) {
            return null;
        }

        if (rec.isArray() && !rec.isEmpty()) {
            String value = rec.get(0).path("transactionUniqueNo").asText(null);
            return StringUtils.hasText(value) ? value : null;
        }

        String value = rec.path("transactionUniqueNo").asText(null);
        return StringUtils.hasText(value) ? value : null;
    }
}