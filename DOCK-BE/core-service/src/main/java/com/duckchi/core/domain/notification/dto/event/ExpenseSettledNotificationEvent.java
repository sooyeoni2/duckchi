package com.duckchi.core.domain.notification.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSettledNotificationEvent {

    private Long expenseId; //결제안 id
    private String expenseTitle; //결제안 제목
    private Long roomId; //방 아이디(라우팅용)
    private Long payerUserId; //임시총무 id

    private LocalDateTime occurredAt; //이벤트 발행 시각

}