package com.duckchi.pay.domain.room.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "모임 정보 수정 요청 DTO")
public class UpdateRoomRequest {

    @Schema(description = "변경할 모임명 (배열이 아닌 문자열, 선택)", example = "제주여행(수정)", nullable = true)
    @Pattern(regexp = "^(?!\\s*$).+", message = "모임명은 공백으로만 이루어질 수 없습니다.")
    @Size(max = 100, message = "모임명은 100자 이하여야 합니다.")
    private String name;

    @Schema(description = "변경할 카테고리 (선택)", example = "TRAVEL", nullable = true)
    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다.")
    private String category;

    @Schema(description = "변경할 세부 내용 (선택)", example = "제주도 뒷풀이 모임입니다.", nullable = true)
    @Size(max = 255, message = "세부 내용은 255자 이하여야 합니다.")
    private String description;
}
