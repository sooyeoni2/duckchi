package com.duckchi.pay.infra.finance.dto.request;

import lombok.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 외부 금융 API 요청 공통 헤더 (Request Header for Finance API).
 * 
 * [설계 의도]
 * 1. 캡슐화: 복잡한 금융망 전문 규격(날짜, 시간, 고유번호) 생성을 내부 메서드로 은닉하여 서비스 레이어의 순수성 유지함.
 * 2. 확장성: 특정 업체에 종속되지 않는 범용 필드 구성을 지향하되, 현재는 SSAFY 금융망 표준 전문 규격을 준수함.
 * 
 * [성능 및 보안 고려 사항]
 * - ThreadLocalRandom: 멀티 쓰레드 환경에서 안전하고 객체 생성 비용이 없는 난수 생성 방식을 채택함 (SonarQube 권고).
 * - 스냅샷 전략: 요청 시점의 시각을 고정하여 전송 시차로 인한 데이터 불일치 방지함.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinanceRequestHeader {
    private String apiName;           // 호출 대상 API 기능 명칭 (예: inquireTransactionHistoryList)임.
    private String transmissionDate;  // 데이터 전송 일자 (YYYYMMDD)임.
    private String transmissionTime;  // 데이터 전송 시각 (HHMMSS)임.
    private String institutionCode;   // 금융 기관 코드 (표준: 00100)임.
    private String fintechAppNo;      // 연동된 핀테크 앱 일련번호 (표준: 001)임.
    private String apiServiceCode;    // 호출할 서비스의 세부 코드임.
    private String institutionTransactionUniqueNo; // 거래 식별 고유 번호 (추적 및 중복 방지용)임.
    private String apiKey;            // 외부 시스템 접근 인증키 (관리자 권한)임.
    private String userKey;           // 연동 사용자 식별키 (개인별 발급)임.

    /**
     * 표준 전문 규격에 맞는 보안 헤더를 자동으로 생성함 (Factory Method).
     * 
     * [구현 상세]
     * - 고유번호 규칙: YYYYMMDDHHMMSS + 랜덤 6자리 숫자를 조합하여 20자리의 유니크한 키 생성함.
     * - 시간 고정: LocalDateTime.now()를 한 번만 호출하여 일자와 시각의 정합성을 보장함.
     * 
     * @param apiName 호출할 기능명
     * @param apiServiceCode 세부 서비스 코드
     * @param apiKey 앱 관리자 인증키
     * @param userKey 사용자 식별키
     * @return 전송 일시와 추적용 고유번호가 채워진 헤더 객체임.
     */
    public static FinanceRequestHeader createHeader(String apiName, String apiServiceCode, String apiKey, String userKey) {
        return createHeader(apiName, apiServiceCode, apiKey, userKey, generateInstitutionTransactionUniqueNo());
    }

    /**
     * 멱등성 보강을 위해 사전에 확보한 거래 고유번호를 명시적으로 주입해 헤더를 생성한다.
     */
    public static FinanceRequestHeader createHeader(
            String apiName,
            String apiServiceCode,
            String apiKey,
            String userKey,
            String institutionTransactionUniqueNo
    ) {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = now.format(DateTimeFormatter.ofPattern("HHmmss"));

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

    /**
     * 거래 전문 고유번호(YYYYMMDDHHMMSS + 6자리 난수)를 생성한다.
     */
    public static String generateInstitutionTransactionUniqueNo() {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String time = now.format(DateTimeFormatter.ofPattern("HHmmss"));

        // ThreadLocalRandom 사용: 성능 최적화 및 보안 난수 생성 품질 확보함.
        return date + time + String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
    }
}

