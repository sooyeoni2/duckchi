package com.duckchi.core.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    //COMMON
    COMMON_INTERNAL_ERROR("COMMON-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "예상치 못한 서버 오류가 발생하였습니다."),
    COMMON_INVALID_INPUT("COMMON-400-1", HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),

    // AUTH
    AUTH_INVALID_LOGIN_REQUEST("AUTH-400-1", HttpStatus.BAD_REQUEST, "로그인 요청 값이 올바르지 않습니다."),
    AUTH_LOGIN_FAILED("AUTH-401-1", HttpStatus.UNAUTHORIZED, "로그인에 실패했습니다. 다시 시도해 주세요."),
    AUTH_INVALID_REFRESH_TOKEN("AUTH-400-3", HttpStatus.BAD_REQUEST, "리프레시 토큰이 올바르지 않습니다."),
    AUTH_SESSION_EXPIRED("AUTH-401-2", HttpStatus.UNAUTHORIZED, "세션이 만료되었습니다. 다시 로그인해 주세요."),
    AUTH_ABNORMAL_TOKEN_USAGE("AUTH-409-1", HttpStatus.CONFLICT, "비정상적인 토큰 사용이 감지되었습니다. 다시 로그인해 주세요."),
    AUTH_TOKEN_REISSUE_FAILED("AUTH-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "토큰 재발급에 실패했습니다. 잠시 후 다시 시도해 주세요.");




    private final String code; //에러코드
    private final HttpStatus httpStatus; //http상태코드
    private final String msg; //에러메세지


}
