package com.duckchi.pay.infra.finance.dto.response;

import lombok.*;

/**
 * 외부 금융 API 응답 공통 헤더.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceResponseHeader {
    private String responseCode;      // 응답 코드 (H0000: 정상)임.
    private String responseMessage;   // 응답 메시지임.
    private String apiName;
    private String transmissionDate;
    private String transmissionTime;
    private String institutionCode;
    private String fintechAppNo;
    private String apiServiceCode;
    private String institutionTransactionUniqueNo;
    private String apiKey;
    private String userKey;
}
