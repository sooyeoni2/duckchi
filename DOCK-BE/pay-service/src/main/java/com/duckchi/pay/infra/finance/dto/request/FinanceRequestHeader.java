package com.duckchi.pay.infra.finance.dto.request;

import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 외부 금융 API 요청 공통 헤더.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceRequestHeader {
    private String apiName;           // API 기능 명칭임.
    private String transmissionDate;  // 전송 일자 (YYYYMMDD)임.
    private String transmissionTime;  // 전송 시각 (HHMMSS)임.
    private String institutionCode;   // 기관 코드 (00100)임.
    private String fintechAppNo;      // 앱 일련번호 (001)임.
    private String apiServiceCode;    // 세부 서비스 코드임.
    private String institutionTransactionUniqueNo; // 거래 식별 고유 번호임.
    private String apiKey;            // 앱 관리자 인증키임.
    private String userKey;           // 사용자 식별키임.

    /**
     * 표준 규격 헤더 자동 생성함.
     */
    public static FinanceRequestHeader createHeader(String apiName, String apiServiceCode, String apiKey, String userKey) {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String uniqueNo = date + time + String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));

        return FinanceRequestHeader.builder()
                .apiName(apiName)
                .transmissionDate(date)
                .transmissionTime(time)
                .institutionCode("00100")
                .fintechAppNo("001")
                .apiServiceCode(apiServiceCode)
                .institutionTransactionUniqueNo(uniqueNo)
                .apiKey(apiKey)
                .userKey(userKey)
                .build();
    }
}
