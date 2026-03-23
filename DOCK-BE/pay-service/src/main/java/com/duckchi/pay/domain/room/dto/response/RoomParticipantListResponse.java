package com.duckchi.pay.domain.room.dto.response;

import lombok.Builder;
import lombok.Getter;


/*
 * [ROOM-16] 모임 참여 인원 조회 응답 DTO.
 * Core Service에서 조회한 프로필 정보를 포함한다.
 */
@Getter
@Builder
public class RoomParticipantListResponse {

    private Long userId;
    private String profileUrl;
    private String name;
    private String role;
}
