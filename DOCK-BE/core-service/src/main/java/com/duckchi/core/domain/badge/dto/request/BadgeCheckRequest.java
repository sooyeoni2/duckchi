package com.duckchi.core.domain.badge.dto.request;

import com.duckchi.core.domain.badge.enums.BadgeEventType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * [BADGE-02] 뱃지 조건 체크 요청 DTO.
 * Pay Service 또는 Core 내부에서 이벤트 발생 시 호출하여 뱃지 진행도를 갱신한다.
 *
 * [사용 예시]
 * 1. 정산 완료 시: eventType=SETTLEMENT_COMPLETED, amount=50000, isAssassin=true 등
 * 2. 방 참여 시:   eventType=ROOM_JOINED, category="회식", inviterId=3 등
 * 3. 방 생성 시:   eventType=ROOM_CREATED
 * 4. OCR 등록 시:  eventType=EXPENSE_OCR_ADDED
 * 5. 계좌 등록 시: eventType=ACCOUNT_REGISTERED, totalAccounts=3
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeCheckRequest {

    // ----- 공통 필드 -----

    /** 대상 유저 ID (필수) */
    @NotNull(message = "userId는 필수입니다.")
    private Long userId;

    /** 이벤트 타입 (필수). 5가지 중 하나. */
    @NotNull(message = "eventType은 필수입니다.")
    private BadgeEventType eventType;

    // ----- SETTLEMENT_COMPLETED 전용 필드 -----

    /** 정산 금액 (원 단위). NOBLE_DUCK 카운트 계산에 사용. */
    private Integer amount;

    /** 1시간 이내 입금 여부. true이면 ASSASSIN_DUCK 카운트 +1 */
    private Boolean isAssassin;

    /** 48시간 이상 지연 송금 여부. true이면 TURTLE_DUCK 카운트 +1 */
    private Boolean isTurtle;

    /** 자정~새벽5시 사이 송금 여부. true이면 NIGHTOWL_DUCK 카운트 +1 */
    private Boolean isNightOwl;

    // ----- ROOM_JOINED 전용 필드 -----

    /** 초대 링크를 생성한 유저 ID. 있으면 해당 유저의 INVITE_MASTER 카운트 +1 */
    private Long inviterId;

    /** 참여한 방의 카테고리. ALLROUNDER_DUCK 판별에 사용. */
    private String category;

    /** 해당 유저에게 새로운 카테고리인지 여부. true이면 ALLROUNDER_DUCK 카운트 +1 */
    private Boolean isNewCategory;

    // ----- ACCOUNT_REGISTERED 전용 필드 -----

    /** 현재 유저의 총 등록 계좌 수. MANSOUR_DUCK의 current_count를 이 값으로 덮어쓴다. */
    private Integer totalAccounts;
}
