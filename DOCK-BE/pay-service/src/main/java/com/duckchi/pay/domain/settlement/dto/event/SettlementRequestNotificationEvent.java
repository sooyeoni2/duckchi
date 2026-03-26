package com.duckchi.pay.domain.settlement.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementRequestNotificationEvent {

    private Long receiverId; //정산 받는 사람 id
    private boolean isAgreed; //자동이체 동의 여부
    private Long roomId;//roomId(프론트 라우팅용)
    private String roomName; //모임방 이름
    private Integer totalAmount; //보낼 총 금액
    private String requesterUserName; //결제자 이름
    private Map<Long,String> settlements; //받은 정산 요청들(정산id,정산 항목명)
}
