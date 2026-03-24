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

    //PAY PASSWORD
    PAY_PASSWORD_ALREADY_SET("PAYPASS-409-1",HttpStatus.CONFLICT,"이미 결제 비밀번호가 설정되었습니다."),
    PAY_PASSWORD_NOT_FOUND("PAYPASS-404-1",HttpStatus.NOT_FOUND,"결제 비밀번호가 설정되어있지 않습니다."),
    PAY_PASSWORD_MISMATCH("PAYPASS-400-1",HttpStatus.BAD_REQUEST,"결제 비밀번호가 틀립니다."),
    PAY_PASSWORD_RESET("PAYPASS-400-2",HttpStatus.BAD_REQUEST,"결제 비밀번호가 3회 틀렸습니다. 다시 계좌를 등록해주세요."),
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
    ACCOUNT_VERIFICATION_FAILED("ACCOUNT-502-1", HttpStatus.BAD_GATEWAY, "1원 인증에 실패했습니다. 잠시 후 다시 시도해 주세요."),

    // NOTIFICATION
    NOTIFICATION_TOKEN_CONFLICT("NOTIFICATION-409-1", HttpStatus.CONFLICT, "FCM 토큰 저장 중 충돌이 발생했습니다."),
    NOTIFICATION_TOKEN_UPSERT_FAILED("NOTIFICATION-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "FCM 토큰 등록에 실패했습니다."),
    NOTIFICATION_TOKEN_INVALID("NOTIFICATION-400-1",HttpStatus.BAD_REQUEST,"FCM 토큰이 유효하지 않습니다."),
    NOTIFICATION_TEST_SEND_FAILED("NOTIFICATION-500-2", HttpStatus.INTERNAL_SERVER_ERROR, "FCM 테스트 알림 발송에 실패했습니다."),
    NOTIFICATION_INVALID_INPUT("NOTIFICATION-400-1", HttpStatus.BAD_REQUEST, "알림 설정값이 올바르지 않습니다."),
    NOTIFICATION_UPDATE_FAILED("NOTIFICATION-500-3", HttpStatus.INTERNAL_SERVER_ERROR, "알림 설정 변경에 실패했습니다. 잠시 후 다시 시도해 주세요."),

    // PROFILE
    PROFILE_INVALID_INPUT("PROFILE-400-1", HttpStatus.BAD_REQUEST, "수정할 값이 올바르지 않습니다."),
    PROFILE_UPDATE_FAILED("PROFILE-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "자동이체 한도 변경에 실패했습니다. 잠시 후 다시 시도해 주세요."),

    // USER
    USER_NOT_FOUND("USER-404-1", HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),

    // BADGE
    // [BADGE-04] 뱃지 획득 이력을 찾을 수 없는 경우 (user_badges 조회 실패)
    BADGE_USER_NOT_FOUND("BADGE-404-1", HttpStatus.NOT_FOUND, "뱃지를 찾을 수 없습니다."),
    // [BADGE-03] 뱃지 마스터 정의를 찾을 수 없는 경우 (badges 코드 조회 실패)
    BADGE_NOT_FOUND("BADGE-404-2", HttpStatus.NOT_FOUND, "뱃지를 찾을 수 없습니다."),
    // [BADGE-04] 이미 읽음 처리된 뱃지를 다시 읽음 처리하려는 경우
    BADGE_ALREADY_READ("BADGE-409-1", HttpStatus.CONFLICT, "이미 확인된 뱃지입니다."),
    // [BADGE-02] 올바르지 않은 이벤트 타입이 전달된 경우
    BADGE_INVALID_EVENT_TYPE("BADGE-400-1", HttpStatus.BAD_REQUEST, "올바르지 않은 이벤트 타입입니다.");
    private final String code; //에러코드
    private final HttpStatus httpStatus; //http상태코드
    private final String msg; //에러메세지


}
