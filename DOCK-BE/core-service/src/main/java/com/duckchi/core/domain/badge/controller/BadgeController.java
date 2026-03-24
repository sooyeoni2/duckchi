package com.duckchi.core.domain.badge.controller;

import com.duckchi.core.domain.badge.dto.response.BadgeListResponse;
import com.duckchi.core.domain.badge.dto.response.BadgeProgressResponse;
import com.duckchi.core.domain.badge.service.BadgeService;
import com.duckchi.core.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 뱃지 도메인 컨트롤러.
 * BADGE-01, BADGE-03, BADGE-04 API를 제공한다.
 * BADGE-02(조건 체크)는 Kafka 이벤트 연동과 함께 추후 추가 예정.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Badge", description = "뱃지 관련 API")
public class BadgeController {

    private final BadgeService badgeService;

    /*
     * [BADGE-01] 내 전체 뱃지 목록 조회
     * FE에서 GET /api/v1/profiles/badges 로 호출한다.
     * 획득한 뱃지와 미획득 뱃지를 분류하여 반환한다.
     */
    @Operation(summary = "뱃지 목록 조회", description = "내 전체 뱃지 획득 이력 및 미획득 뱃지 진행 현황을 조회합니다.")
    @GetMapping("/api/v1/profiles/badges")
    public ResponseEntity<ApiResponseDto<BadgeListResponse>> getBadgeList(
            @RequestHeader("X-User-Id") Long userId
    ) {
        BadgeListResponse response = badgeService.getBadgeList(userId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /*
     * [BADGE-03] 특정 뱃지 진행도 조회
     * 미획득 뱃지의 현재 달성 진행도를 조회한다.
     * badgeCode: 뱃지 고유 코드 (ex: NOBLE_DUCK, ASSASSIN_DUCK)
     */
    @Operation(summary = "뱃지 진행도 조회", description = "특정 미획득 뱃지의 현재 달성 진행도를 조회합니다.")
    @GetMapping("/api/v1/badges/{badgeCode}/progress")
    public ResponseEntity<ApiResponseDto<BadgeProgressResponse>> getBadgeProgress(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable String badgeCode
    ) {
        BadgeProgressResponse response = badgeService.getBadgeProgress(userId, badgeCode);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /*
     * [BADGE-04] 뱃지 획득 알림 읽음 처리
     * 뱃지 획득 팝업/알림을 사용자가 확인했을 때 읽음 처리한다.
     * badgeId: user_badges 테이블의 PK
     */
    @Operation(summary = "뱃지 읽음 처리", description = "뱃지 획득 알림을 사용자가 확인했을 때 읽음 처리합니다.")
    @PatchMapping("/api/v1/badges/{badgeId}/read")
    public ResponseEntity<ApiResponseDto<Void>> markBadgeAsRead(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long badgeId
    ) {
        badgeService.markBadgeAsRead(userId, badgeId);
        return ResponseEntity.ok(ApiResponseDto.successMsg("확인 처리되었습니다."));
    }
}
