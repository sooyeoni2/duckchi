package com.duckchi.pay.domain.expenses.dto.external;

import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

/**
 * 외부 금융 API 공통 헤더
 * 모든 요청/응답에 포함되는 표준 규격 정의함.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceHeader {
    private String apiName;           // API 기능 명칭
    private String transmissionDate;  // 전송 일자 (YYYYMMDD)
    private String transmissionTime;  // 전송 시각 (HHMMSS)
    private String institutionCode;   // 기관 코드 (00100)
    private String fintechAppNo;      // 앱 일련번호 (001)
    private String apiServiceCode;    // 세부 서비스 코드
    private String institutionTransactionUniqueNo; // 거래 식별 고유 번호
    private String apiKey;            // 앱 관리자 인증키
    private String userKey;           // 사용자 식별키

    /**
     * 표준 규격 헤더 자동 생성함.
     */
    public static FinanceHeader createHeader(String apiName, String apiServiceCode, String apiKey, String userKey) {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = now.format(DateTimeFormatter.ofPattern("HHmmss"));
        String uniqueNo = date + time + String.format("%06d", new Random().nextInt(1000000));

        return FinanceHeader.builder()
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
