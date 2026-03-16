package com.duckchi.core.infra.finance;

import com.duckchi.core.infra.finance.dto.request.OneVerifyApiRequestHeader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class OneVerifyHeaderFactory {
    @Value("${finance.api.key}")
    private String financeApiKey;

    private static final String INSTITUTION_CODE = "00100";
    private static final String FINTECH_APP_NO = "001";

    public OneVerifyApiRequestHeader create(String apiName, String userKey) {
        LocalDateTime now = LocalDateTime.now();

        String transmissionDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String transmissionTime = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String institutionTransactionUniqueNo =
                transmissionDate
                        + transmissionTime
                        + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));

        return new OneVerifyApiRequestHeader(
                apiName,
                transmissionDate,
                transmissionTime,
                INSTITUTION_CODE,
                FINTECH_APP_NO,
                apiName,
                institutionTransactionUniqueNo,
                financeApiKey,
                userKey
        );
    }
}
