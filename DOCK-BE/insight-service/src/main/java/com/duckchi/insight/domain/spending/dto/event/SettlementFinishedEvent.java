package com.duckchi.insight.domain.spending.dto.event;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Pay Service에서 정산 완료 시 발행하는 Kafka 이벤트 DTO.
 * 이 규격에 따라 Insight Service가 지출 로그를 기록함.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementFinishedEvent {

    // 1. 누가 썼는지 (Insight DB의 user_id)
    private Long userId;

    // 2. 어느 방의 어느 회차인지 (Insight DB의 room_id, room_session_id)
    private Long roomId;
    private Long roomSessionId;

    // 3. 방 이름과 최종 카테고리 (Insight DB의 room_name, category)
    private String roomName;
    private String category;

    // 4. 이 회차에서 해당 사용자가 최종 부담한 정산 금액 (Insight DB의 amount)
    private Integer amount;

    // 5. 정산이 완료된 시점 (기록 시점)
    private LocalDateTime endedAt;
}