package com.duckchi.core.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    // COMMON
    COMMON_INTERNAL_ERROR("COMMON-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "예상치 못한 서버 오류가 발생했습니다."),
    COMMON_INVALID_INPUT("COMMON-400-1", HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),

    // AUTH
    AUTH_UNAUTHORIZED("AUTH-401-1", HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),

    // ACCOUNT
    ACCOUNT_INVALID_INPUT("ACCOUNT-400-1", HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    ACCOUNT_ALREADY_REGISTERED("ACCOUNT-409-1", HttpStatus.CONFLICT, "이미 등록된 계좌입니다."),
    ACCOUNT_REGISTRATION_FAILED("ACCOUNT-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "계좌 등록에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    ACCOUNT_INVALID("ACCOUNT-404-1",HttpStatus.NOT_FOUND,"활성화된 계좌를 찾을 수 없습니다."),
    ACCOUNT_VERIFICATION_FAILED("ACCOUNT-502-1",HttpStatus.BAD_GATEWAY ,"1원 송금에 실패했습니다. 잠시 후 다시 시도해 주세요." );
    private final String code;
    private final HttpStatus httpStatus;
    private final String msg;
}
