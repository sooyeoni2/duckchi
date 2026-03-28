package com.duckchi.insight.domain.spending.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방별 정산 빈도 랭킹 응답 (AN-05)")
public record RoomFrequencyResponse(
        @Schema(description = "모임방 ID", example = "10")
        Long roomId,

        @Schema(description = "모임방 이름 (가장 최근 기록 기준)", example = "강남 친구들")
        String roomName,

        @Schema(description = "해당 방에서의 정산 횟수", example = "5")
        Integer count
) {}
