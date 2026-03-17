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
    COMMON_MISSING_REQUEST_HEADER("COMMON-400-2",HttpStatus.BAD_REQUEST,"필수 요청 헤더가 누락되었습니다."),
    // AUTH
    AUTH_INVALID_LOGIN_REQUEST("AUTH-400-1", HttpStatus.BAD_REQUEST, "로그인 요청 값이 올바르지 않습니다."),
    AUTH_LOGIN_FAILED("AUTH-401-1", HttpStatus.UNAUTHORIZED, "로그인에 실패했습니다. 다시 시도해 주세요."),
    AUTH_INVALID_REFRESH_TOKEN("AUTH-400-3", HttpStatus.BAD_REQUEST, "리프레시 토큰이 올바르지 않습니다."),
    AUTH_SESSION_EXPIRED("AUTH-401-2", HttpStatus.UNAUTHORIZED, "세션이 만료되었습니다. 다시 로그인해 주세요."),
    AUTH_ABNORMAL_TOKEN_USAGE("AUTH-409-1", HttpStatus.CONFLICT, "비정상적인 토큰 사용이 감지되었습니다. 다시 로그인해 주세요."),
    AUTH_TOKEN_REISSUE_FAILED("AUTH-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "토큰 재발급에 실패했습니다. 잠시 후 다시 시도해 주세요."),


    // AUTH
    AUTH_UNAUTHORIZED("AUTH-401-1", HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),

    // ACCOUNT
    ACCOUNT_INVALID_INPUT("ACCOUNT-400-1", HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    ACCOUNT_AUTH_CODE_EXPIRED("ACCOUNT-400-6", HttpStatus.BAD_REQUEST, "인증시간이 만료되었습니다."),
    ACCOUNT_AUTH_CODE_MISMATCH("ACCOUNT-400-7", HttpStatus.BAD_REQUEST, "인증코드가 일치하지 않습니다."),
    ACCOUNT_AUTH_TEXT_INVALID("ACCOUNT-400-8", HttpStatus.BAD_REQUEST, "인증 문구가 올바르지 않습니다."),
    ACCOUNT_AUTH_CODE_INVALID("ACCOUNT-400-9", HttpStatus.BAD_REQUEST, "유효하지 않은 인증코드입니다."),
    ACCOUNT_INVALID("ACCOUNT-404-1", HttpStatus.NOT_FOUND, "계좌 정보를 찾을 수 없습니다."),
    ACCOUNT_AUTH_CODE_NOT_ISSUED("ACCOUNT-404-2", HttpStatus.NOT_FOUND, "인증코드 발급 기록이 없습니다."),
    ACCOUNT_ALREADY_REGISTERED("ACCOUNT-409-1", HttpStatus.CONFLICT, "이미 등록된 계좌입니다."),
    ACCOUNT_USER_ALREADY_REGISTERD("ACCOUNT-409-2",HttpStatus.CONFLICT,"계좌는 1개만 등록할 수 있습니다."),
    ACCOUNT_VERIFICATION_LOCKED("ACCOUNT-423-1", HttpStatus.LOCKED, "인증 실패 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요."),
    ACCOUNT_REGISTRATION_FAILED("ACCOUNT-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "계좌 등록에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    ACCOUNT_VERIFICATION_FAILED("ACCOUNT-502-1", HttpStatus.BAD_GATEWAY, "1원 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    private final String code; //에러코드
    private final HttpStatus httpStatus; //http상태코드
    private final String msg; //에러메세지


}
