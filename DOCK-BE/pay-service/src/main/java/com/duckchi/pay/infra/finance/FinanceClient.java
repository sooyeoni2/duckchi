package com.duckchi.pay.infra.finance;

import com.duckchi.pay.infra.config.FinanceFeignConfig;
import com.duckchi.pay.infra.finance.dto.request.TransactionHistoryRequest;
import com.duckchi.pay.infra.finance.dto.request.TransferRequest;
import com.duckchi.pay.infra.finance.dto.response.TransactionHistoryResponse;
import com.duckchi.pay.infra.finance.dto.response.TransferResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

/**
 * 외부 금융 시스템 통신 전용 클라이언트 인터페이스 (Feign Client).
 * 
 * [기술적 선정 이유]
 * 1. 선언적 아키텍처: 인터페이스 정의만으로 외부 API를 호출할 수 있어 비즈니스 로직과 통신 로직이 명확히 분리됨.
 * 2. 유지보수성: URL, Path 등을 어노테이션으로 관리하여 통신 규격 변경 시 대응이 빠름.
 * 
 * [주의사항 및 사이드 이펙트]
 * - 외부망 의존성: 외부 서버 장애 시 해당 메서드를 호출하는 서비스 레이어까지 영향이 전파됨. (추후 Circuit Breaker 도입 검토 필요)
 * - 네트워크 비용: 동기(Sync) 방식 호출이므로 응답이 올 때까지 쓰레드가 대기(Blocking)함.
 */
@FeignClient(
    name = "finance-client", 
    url = "${finance.api.base-url}", // 환경변수 주입을 통해 운영/로컬 환경 유연하게 대응함.
    path = "/ssafy/api/v1/edu/demandDeposit", // 금융망 도메인별 공통 경로를 상단에 추상화하여 중복 제거함.
    configuration = FinanceFeignConfig.class
)
public interface FinanceClient {

    /**
     * 계좌 거래 내역 실시간 조회함 (PAY-01).
     * 
     * [통신 특이사항]
     * - 금융망 규격에 따라 조회 요청임에도 보안상 POST 방식을 사용함.
     * - 모든 요청은 FinanceRequestHeader를 포함한 JSON Body 형태를 유지해야 함.
     * 
     * @param request 보안 헤더 및 조회 조건을 포함한 표준 전문 객체임.
     * @return 거래 내역 및 처리 결과 메시지를 포함한 응답 전문임.
     */
    @PostMapping("/inquireTransactionHistoryList")
    TransactionHistoryResponse fetchTransactionHistory(@RequestBody TransactionHistoryRequest request);

    /**
     * 정산 송금을 실행한다 (SET-02).
     *
     * [중요]
     * - 이 메서드는 실제 출금/입금이 발생하는 민감 구간이므로 자동 재시도 금지 정책을 사용한다.
     */
    @PostMapping("/updateDemandDepositAccountTransfer")
    TransferResponse transfer(@RequestBody TransferRequest request);
}