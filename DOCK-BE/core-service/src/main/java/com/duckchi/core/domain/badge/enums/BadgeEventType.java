package com.duckchi.core.domain.badge.enums;

/**
 * 뱃지 조건 체크를 트리거하는 이벤트 타입 정의.
 *
 * 각 이벤트가 발생할 때 Pay Service(또는 Core 내부)에서
 * POST /api/v1/badges/check 를 호출하면서 해당 eventType을 전달한다.
 *
 * [이벤트 → 관련 뱃지 매핑]
 * - SETTLEMENT_COMPLETED: NOBLE_DUCK, ASSASSIN_DUCK, TURTLE_DUCK, NIGHTOWL_DUCK
 * - ROOM_JOINED:          INSSA_DUCK, ALLROUNDER_DUCK, INVITE_MASTER
 * - ROOM_CREATED:         ALLEY_BOSS, INSSA_DUCK
 * - EXPENSE_OCR_ADDED:    SCANNER_DUCK
 * - ACCOUNT_REGISTERED:   MANSOUR_DUCK
 */
public enum BadgeEventType {

    /** 정산 송금 완료 시 발생. Pay Service에서 호출. */
    SETTLEMENT_COMPLETED,

    /** 모임방 참여(입장) 시 발생. Pay Service에서 호출. */
    ROOM_JOINED,

    /** 모임방 개설(방장) 시 발생. Pay Service에서 호출. */
    ROOM_CREATED,

    /** OCR 영수증 결제 등록 시 발생. Pay Service에서 호출. */
    EXPENSE_OCR_ADDED,

    /** 계좌 등록 완료 시 발생. Core Service 내부에서 호출. */
    ACCOUNT_REGISTERED
}
