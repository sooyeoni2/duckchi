package com.duckchi.core.domain.user.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserProfileEditRequest {

    @NotNull
    @Min(0)
    private Integer transferLimit;
}
