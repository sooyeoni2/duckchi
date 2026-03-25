package com.duckchi.pay.domain.settlement.dto.event;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 정산 완료 시 발행하는 Kafka 이벤트 DTO (Pay -> Insight).
 * 해당 회차 종료 시 사용자의 총 지출액을 담아 전송한다.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementFinishedEvent {
    private Long userId;
    private Long roomId;
    private Long roomSessionId;
    private String roomName;
    private String category;
    private Integer amount;
    private LocalDateTime endedAt;
}
