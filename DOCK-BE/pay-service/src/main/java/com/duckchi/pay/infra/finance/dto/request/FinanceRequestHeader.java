package com.duckchi.pay.infra.finance.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceRequestHeader {
    private static final ZoneId KST_ZONE_ID = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmmss");

    private String apiName;
    private String transmissionDate;
    private String transmissionTime;
    private String institutionCode;
    private String fintechAppNo;
    private String apiServiceCode;
    private String institutionTransactionUniqueNo;
    private String apiKey;
    private String userKey;

    public static FinanceRequestHeader createHeader(String apiName, String apiServiceCode, String apiKey, String userKey) {
        return createHeader(apiName, apiServiceCode, apiKey, userKey, generateInstitutionTransactionUniqueNo());
    }

    public static FinanceRequestHeader createHeader(
            String apiName,
            String apiServiceCode,
            String apiKey,
            String userKey,
            String institutionTransactionUniqueNo
    ) {
        LocalDateTime now = LocalDateTime.now(KST_ZONE_ID);
        String date = now.format(DATE_FORMATTER);
        String time = now.format(TIME_FORMATTER);

        return FinanceRequestHeader.builder()
                .apiName(apiName)
                .transmissionDate(date)
                .transmissionTime(time)
                .institutionCode("00100")
                .fintechAppNo("001")
                .apiServiceCode(apiServiceCode)
                .institutionTransactionUniqueNo(institutionTransactionUniqueNo)
                .apiKey(apiKey)
                .userKey(userKey)
                .build();
    }

    public static String generateInstitutionTransactionUniqueNo() {
        LocalDateTime now = LocalDateTime.now(KST_ZONE_ID);
        String date = now.format(DATE_FORMATTER);
        String time = now.format(TIME_FORMATTER);

        return date + time + String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
    }
}