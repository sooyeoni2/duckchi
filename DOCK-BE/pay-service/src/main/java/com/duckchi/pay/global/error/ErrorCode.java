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
    COMMON_MISSING_REQUEST_HEADER("COMMON-400-2",HttpStatus.BAD_REQUEST,"필수 요청 헤더가 누락되었습니다."),

    // FINANCE (Pay Service)
    FINANCE_API_ERROR("FINANCE-502-1", HttpStatus.BAD_GATEWAY, "외부 금융 시스템과의 통신 중 오류가 발생하였습니다."),
    FINANCE_INVALID_ACCOUNT("FINANCE-400-1", HttpStatus.BAD_REQUEST, "유효하지 않은 계좌 정보입니다."),


    FINANCE_INVALID_ACCOUNT("FINANCE-400-1", HttpStatus.BAD_REQUEST, "유효하지 않은 계좌 정보입니다."),
    EXPENSE_AMOUNT_MISMATCH("EXPENSE-400-1", HttpStatus.BAD_REQUEST, "결제 총액과 참여자별 분담 금액의 합계가 일치하지 않습니다."),
    EXPENSE_CANNOT_MODIFY("EXPENSE-403-1", HttpStatus.FORBIDDEN, "이미 정산 요청된 결제안은 수정하거나 삭제할 수 없습니다."),

    //ROOM
    ROOM_SESSION_MISMATCH("ROOM-400-4", HttpStatus.BAD_REQUEST, "해당 회차는 요청된 모임방에 속해있지 않습니다."),
    ROOM_PARTICIPANT_NOT_FOUND("ROOM-404-2", HttpStatus.NOT_FOUND, "모임에 참여하지 않은 사용자가 포함되어 있습니다."),
    ROOM_MEMBER_ONLY("ROOM-403-1", HttpStatus.FORBIDDEN, "해당 모임의 멤버만 초대 링크를 생성할 수 있습니다."),
    ROOM_NOT_FOUND("ROOM-404-1", HttpStatus.NOT_FOUND, "모임을 찾을 수 없습니다."),
    ROOM_INVALID_INVITE_LINK("ROOM-400-3", HttpStatus.BAD_REQUEST, "초대 링크가 유효하지 않거나 만료되었습니다."),
    ROOM_ALREADY_PARTICIPANT("ROOM-409-1", HttpStatus.CONFLICT, "이미 해당 모임에 참여 중입니다."),
    ROOM_NOT_ADMIN("ROOM-403-4", HttpStatus.FORBIDDEN, "모임 정보 수정 권한이 없습니다."),
    ROOM_CANNOT_UPDATE_STATUS("ROOM-409-4", HttpStatus.CONFLICT, "정산이 진행 중 인 모임은 정보를 수정할 수 없습니다."),
    ROOM_ADMIN_DELEGATION_REQUIRED("ROOM-409-5", HttpStatus.CONFLICT, "방장은 방장 권한을 위임한 후 모임을 나갈 수 있습니다."),
    ROOM_CANNOT_LEAVE_PROGRESS("ROOM-409-6", HttpStatus.CONFLICT, "정산이 진행 중인 모임은 나갈 수 없습니다."),
    ROOM_CANNOT_DELETE_PROGRESS("ROOM-409-7", HttpStatus.CONFLICT, "정산이 진행 중인 모임은 삭제할 수 없습니다.");

    private final String code; //에러코드
    private final HttpStatus httpStatus; //http상태코드
    private final String msg; //에러메세지
}