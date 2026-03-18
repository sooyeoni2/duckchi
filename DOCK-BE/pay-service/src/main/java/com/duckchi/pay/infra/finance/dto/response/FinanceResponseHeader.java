package com.duckchi.pay.infra.finance.dto.response;

import lombok.*;

/**
 * 외부 금융 API 응답 공통 헤더 (Response Header for Finance API).
 * 
 * [설계 의도]
 * 1. 처리 결과 수신: 요청에 대한 성공/실패 여부를 외부 서버로부터 전달받음.
 * 2. 요청-응답 매핑: 'institutionTransactionUniqueNo'를 통해 특정 요청에 대한 응답임을 보장함.
 * 
 * [비즈니스 로직 핵심]
 * - responseCode: 'H0000'이면 정상 처리, 그 외의 코드는 비즈니스 에러로 간주하여 예외 처리가 필요함.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceResponseHeader {
    private String responseCode;      // 처리 결과 코드 (H0000: 정상)임.
    private String responseMessage;   // 처리 결과 상세 메시지임.
    private String apiName;           // 호출된 API 기능 명칭임.
    private String transmissionDate;  // 응답 전송 일자 (YYYYMMDD)임.
    private String transmissionTime;  // 응답 전송 시각 (HHMMSS)임.
    private String institutionCode;   // 기관 코드 (00100)임.
    private String fintechAppNo;      // 핀테크 앱 일련번호 (001)임.
    private String apiServiceCode;    // 서비스 코드임.
    private String institutionTransactionUniqueNo; // 거래 식별 고유 번호 (요청과 동일)임.
    private String apiKey;            // 인증키임.
    private String userKey;           // 사용자 식별키임.
}
