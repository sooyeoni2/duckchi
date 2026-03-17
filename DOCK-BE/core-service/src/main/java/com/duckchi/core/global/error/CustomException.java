package com.duckchi.core.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
public class CustomException extends RuntimeException {
    private final ErrorCode errorCode;
    private final Object data; //data 담을 경우

    public CustomException(ErrorCode errorCode) {
        super(errorCode.getMsg());
        this.errorCode = errorCode;
        this.data = null;
    }

    public CustomException(String message, ErrorCode errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.data = null;
    }

    public CustomException(String message, ErrorCode errorCode, Object data) {
        super(message);
        this.errorCode = errorCode;
        this.data = data;
    }

    public CustomException(ErrorCode errorCode, Object data) {
        super(errorCode.getMsg());
        this.errorCode = errorCode;
        this.data = data;
    }

}
