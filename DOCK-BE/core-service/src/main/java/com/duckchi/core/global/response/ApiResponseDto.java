package com.duckchi.core.global.response;

import com.duckchi.core.global.error.CustomException;
import com.duckchi.core.global.error.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponseDto<T> {
    private final boolean success;
    private final T data;
    private final String msg;
    private final String errorCode;

    //성공

    //(데이터) 응답
    public static <T> ApiResponseDto<T> success(T data) {
        return new ApiResponseDto<>(true, data, null, null);
    }

    //(데이터+메세지) 응답
    public static <T> ApiResponseDto<T> success(T data, String msg) {
        return new ApiResponseDto<>(true, data, msg, null);
    }

    //(메세지) 응답
    public static <T> ApiResponseDto<T> successMsg(String msg) {
        return new ApiResponseDto<>(true, null, msg, null);
    }


    //실패

    //CustomException 전용 응답
    public static <T> ApiResponseDto<T> error(CustomException ex) {

        ErrorCode errorCode = ex.getErrorCode();

        String message =
                (ex.getMessage() != null && !ex.getMessage().isBlank())
                        ? ex.getMessage()
                        : errorCode.getMsg();

        return new ApiResponseDto<>(false,(T) ex.getData(),message,errorCode.getCode());
    }

    //일반 ErrorCode 전용 응답
    public static ApiResponseDto<Void> error(ErrorCode errorCode) {
        return new ApiResponseDto<>(
                false,
                null,
                errorCode.getMsg(),
                errorCode.getCode()
        );
    }


}
