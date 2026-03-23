package com.duckchi.insight.domain.spending.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "방별 지출 통계 응답")
public record RoomSpendResponse(
    @Schema(description = "모임방 ID", example = "10")
    Long roomId,
    
    @Schema(description = "모임방 이름 (가장 최근 기록 기준)", example = "강남 삼겹살")
    String roomName,
    
    @Schema(description = "해당 방에서의 총 지출액", example = "30000")
    Integer amount
) {}
