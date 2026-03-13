package com.duckchi.pay.global.error;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@AllArgsConstructor
public enum ErrorCode {

    //COMMON
    COMMON_UNAUTHORIZED("COMMON-401-1", HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    COMMON_INTERNAL_ERROR("COMMON-500-1", HttpStatus.INTERNAL_SERVER_ERROR, "예상치 못한 서버 오류가 발생하였습니다."),
    COMMON_INVALID_INPUT("COMMON-400-1", HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),

    // FINANCE (Pay Service)
    FINANCE_API_ERROR("FINANCE-502-1", HttpStatus.BAD_GATEWAY, "외부 금융 시스템과의 통신 중 오류가 발생하였습니다."),
    FINANCE_INVALID_ACCOUNT("FINANCE-400-1", HttpStatus.BAD_REQUEST, "유효하지 않은 계좌 정보입니다.");



    //ROOM
    ROOM_MEMBER_ONLY("ROOM-403-1", HttpStatus.FORBIDDEN, "해당 모임의 멤버만 초대 링크를 생성할 수 있습니다."),
    ROOM_NOT_FOUND("ROOM-404-1", HttpStatus.NOT_FOUND, "모임을 찾을 수 없습니다."),
    ROOM_INVALID_INVITE_LINK("ROOM-400-3", HttpStatus.BAD_REQUEST, "초대 링크가 유효하지 않거나 만료되었습니다."),
    ROOM_ALREADY_PARTICIPANT("ROOM-409-1", HttpStatus.CONFLICT, "이미 해당 모임에 참여 중입니다.");

    private final String code; //에러코드
    private final HttpStatus httpStatus; //http상태코드
    private final String msg; //에러메세지
}