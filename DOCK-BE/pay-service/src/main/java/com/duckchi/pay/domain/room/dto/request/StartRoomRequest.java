package com.duckchi.pay.domain.room.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StartRoomRequest {

    @NotBlank(message = "모임 태그는 필수입니다.")
    private String category;

    private String description;

    @Builder
    private StartRoomRequest(String category, String description) {
        this.category = category;
        this.description = description;
    }
}
