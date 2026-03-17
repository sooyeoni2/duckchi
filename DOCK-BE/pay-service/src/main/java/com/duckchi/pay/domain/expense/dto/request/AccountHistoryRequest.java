package com.duckchi.pay.domain.expense.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * 계좌 거래 내역 조회 요청 (Internal Request for Account History).
 * 
 * [설계 의도]
 * 1. 보안 강화: 계좌번호와 같은 민감 정보가 URL 쿼리 파라미터나 서버 로그에 평문으로 노출되는 것을 방지하기 위해 
 *    조회 기능임에도 POST 방식의 Request Body로 수신함.
 * 2. UX 최적화: 사용자가 직접 시작/종료일을 입력하는 번거로움을 제거하고, 서버에서 정책적으로 최근 7일 내역을 자동 조회하도록 설계함.
 * 
 * [제약 사항]
 * - accountNo: 금융망 연동을 위한 필수 식별자이며, 반드시 16자리 규격을 준수해야 함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "계좌 거래 내역 조회 요청 정보")
public class AccountHistoryRequest {

    /**
     * 조회 대상 계좌 번호.
     * @NotBlank: 컨트롤러 진입 전 필수값 검증을 통해 불필요한 서비스 로직 실행 및 외부 API 호출 비용을 절감함.
     */
    @NotBlank(message = "계좌번호는 필수입니다.")
    @Schema(description = "조회 대상 계좌 번호 (16자리)", example = "1234567890123456")
    private String accountNo;
}
