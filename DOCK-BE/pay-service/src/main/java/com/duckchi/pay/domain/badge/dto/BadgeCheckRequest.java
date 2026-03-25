package com.duckchi.pay.domain.badge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Pay Service에서 Core Service의 BADGE-02 API (POST /api/v1/badges/check)를
 * 호출할 때 사용하는 요청 DTO.
 *
 * Core Service의 BadgeCheckRequest와 동일한 필드 구조를 유지한다.
 * Pay Service 측에서 이벤트 발생 시 필요한 Payload만 세팅하여 전송.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeCheckRequest {

    // ----- 공통 필드 -----

    /** 대상 유저 ID (필수) */
    private Long userId;

    /** 이벤트 타입 문자열 (SETTLEMENT_COMPLETED, ROOM_CREATED 등) */
    private String eventType;

    // ----- SETTLEMENT_COMPLETED 전용 -----

    /** 정산 금액 (원 단위). NOBLE_DUCK 카운트에 사용. */
    private Integer amount;

    /** 1시간 이내 입금 여부. ASSASSIN_DUCK 카운트에 사용. */
    private Boolean isAssassin;

    /** 48시간 이상 지연 송금 여부. TURTLE_DUCK 카운트에 사용. */
    private Boolean isTurtle;

    /** 자정~새벽5시 사이 송금 여부. NIGHTOWL_DUCK 카운트에 사용. */
    private Boolean isNightOwl;

    // ----- ROOM_JOINED 전용 -----

    /** 초대 링크 생성자 ID. INVITE_MASTER 카운트에 사용. */
    private Long inviterId;

    /** 참여한 방의 카테고리. ALLROUNDER_DUCK 판별에 사용. */
    private String category;

    /** 해당 유저에게 새로운 카테고리인지 여부. */
    private Boolean isNewCategory;

    // ----- ACCOUNT_REGISTERED 전용 -----

    /** 현재 유저의 총 등록 계좌 수. MANSOUR_DUCK에 사용. */
    private Integer totalAccounts;
}
