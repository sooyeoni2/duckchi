package com.duckchi.pay.domain.room.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

/*
 * [ROOM-15] 방장 위임 요청 DTO.
 * 위임받을 대상 유저의 ID를 전달받는다.
 */
@Getter
@NoArgsConstructor
public class DelegateAdminRequest {

    /*
     * 방장 권한을 넘겨받을 대상 유저 ID.
     * null이면 요청 자체를 거부한다.
     */
    @NotNull(message = "위임 대상 유저 ID는 필수입니다.")
    private Long userId;
}
