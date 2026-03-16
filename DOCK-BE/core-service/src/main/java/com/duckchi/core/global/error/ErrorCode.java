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
    ACCOUNT_AUTH_CODE_EXPIRED("ACCOUNT-400-6", HttpStatus.BAD_REQUEST, "인증시간이 만료되었습니다."),
    ACCOUNT_AUTH_CODE_MISMATCH("ACCOUNT-400-7", HttpStatus.BAD_REQUEST, "인증코드가 일치하지 않습니다."),
    ACCOUNT_AUTH_TEXT_INVALID("ACCOUNT-400-8", HttpStatus.BAD_REQUEST, "인증 문구가 올바르지 않습니다."),
    ACCOUNT_AUTH_CODE_INVALID("ACCOUNT-400-9", HttpStatus.BAD_REQUEST, "유효하지 않은 인증코드입니다."),
    ACCOUNT_INVALID("ACCOUNT-404-1", HttpStatus.NOT_FOUND, "계좌 정보를 찾을 수 없습니다."),
    ACCOUNT_AUTH_CODE_NOT_ISSUED("ACCOUNT-404-2", HttpStatus.NOT_FOUND, "인증코드 발급 기록이 없습니다."),
    ACCOUNT_ALREADY_REGISTERED("ACCOUNT-409-1", HttpStatus.CONFLICT, "이미 등록된 계좌입니다."),
    ACCOUNT_REGISTRATION_FAILED("ACCOUNT-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "계좌 등록에 실패했습니다. 잠시 후 다시 시도해 주세요."),
    ACCOUNT_VERIFICATION_FAILED("ACCOUNT-502-1", HttpStatus.BAD_GATEWAY, "1원 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.");

    private final String code;
    private final HttpStatus httpStatus;
    private final String msg;
}
