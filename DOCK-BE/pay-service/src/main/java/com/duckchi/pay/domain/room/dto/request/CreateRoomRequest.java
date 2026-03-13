package com.duckchi.pay.domain.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateRoomRequest {

    @NotBlank(message = "모임명은 필수입니다.")
    @Size(max = 100, message = "모임명은 100자 이하여야 합니다.")
    private String name;

    @Size(max = 50, message = "카테고리는 50자 이하여야 합니다.")
    private String category;

    @Size(max = 255, message = "세부 설명은 255자 이하여야 합니다.")
    private String description;
}
