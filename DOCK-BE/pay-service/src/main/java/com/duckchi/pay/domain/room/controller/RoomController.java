package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.DelegateAdminRequest;
import com.duckchi.pay.domain.room.dto.request.StartRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.*;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import com.duckchi.pay.global.error.CustomException;
import com.duckchi.pay.global.error.ErrorCode;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
@Tag(name = "Room", description = "ROOM API")
public class RoomController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final RoomService roomService;

    @PostMapping
    @Operation(summary = "ROOM-01: 모임 방 생성 API ")
    public ResponseEntity<ApiResponseDto<CreateRoomResponse>> createRoom(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        CreateRoomResponse response = roomService.createRoom(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}/auto-debit/consents")
    @Operation(summary = "ROOM-04: 자동이체 동의/거절 API ")
    public ResponseEntity<ApiResponseDto<UpdateAutoDebitConsentResponse>> updateAutoDebitConsent(
            @PathVariable Long roomId,
            @RequestParam AutoDebitConsentStatus status,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        UpdateAutoDebitConsentResponse response = roomService.updateAutoDebitConsent(roomId, currentUserId, status);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/{roomId}/auto-debit/consents")
    @Operation(summary = "ROOM-20: 자동이체 동의 상태 조회 API")
    public ResponseEntity<ApiResponseDto<GetAutoDebitConsentResponse>> getAutoDebitConsent(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        GetAutoDebitConsentResponse response = roomService.getAutoDebitConsent(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/room-lists")
    @Operation(summary = "ROOM-08 Get room lists")
    public ResponseEntity<ApiResponseDto<List<RoomListResponse>>> getRoomLists(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @RequestParam(value = "isProgress", required = false) Boolean isProgress
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        List<RoomListResponse> response = roomService.getRoomLists(currentUserId, isProgress);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/{roomId}/my-set")
    @Operation(summary = "ROOM-12: 내 정산 목록 조회 API")
    public ResponseEntity<ApiResponseDto<RoomMySetResponse>> getMySet(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        RoomMySetResponse response = roomService.getMySet(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @GetMapping("/{roomId}/expenses/{expenseId}/settlement-detail")
    @Operation(summary = "ROOM-13: 정산 현황 조회 API")
    public ResponseEntity<ApiResponseDto<RoomSettlementDetailResponse>> getSettlementDetail(
            @PathVariable Long roomId,
            @PathVariable Long expenseId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        RoomSettlementDetailResponse response = roomService.getSettlementDetail(roomId, expenseId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}/my-transfer-agree")
    @Operation(summary = "ROOM-14 모임방 자동이체 동의 여부 수정")
    public ResponseEntity<ApiResponseDto<UpdateAutoDebitConsentResponse>> toggleAutoDebitConsent(
            @PathVariable("roomId") Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        UpdateAutoDebitConsentResponse response = roomService.toggleAutoDebitConsent(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}")
    @Operation(summary = "ROOM-05 모임 정보 수정")
    public ResponseEntity<ApiResponseDto<String>> updateRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody UpdateRoomRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.updateRoomInfo(roomId, currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success("수정이 완료되었습니다."));
    }

    @DeleteMapping("/{roomId}/members/left")
    @Operation(summary = "ROOM-06 모임 방 나가기")
    public ResponseEntity<ApiResponseDto<String>> leaveRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.leaveRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방을 성공적으로 나갔습니다."));
    }

    @DeleteMapping("/{roomId}/delete")
    @Operation(summary = "ROOM-07 모임 방 삭제")
    public ResponseEntity<ApiResponseDto<String>> deleteRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.deleteRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방이 성공적으로 삭제되었습니다."));
    }

    // ──────────────────────────────────────────────────────────────
    // ROOM-17: 모임 시작 / ROOM-18: 모임 종료
    // ──────────────────────────────────────────────────────────────

    /**
     * [ROOM-17] 모임을 시작한다.
     * 별도 페이지에서 카테고리와 세부 내용을 입력받아 전달받는다.
     * 성공하면 isProgress=true로 전환되며, FE에서 종료 버튼으로 UI가 바뀐다.
     */
    @PostMapping("/{roomId}/start")
    @Operation(summary = "ROOM-17 모임 시작")
    public ResponseEntity<ApiResponseDto<String>> startRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody StartRoomRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.startRoom(roomId, currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success("모임이 시작되었습니다."));
    }

    /**
     * [ROOM-18] 모임을 종료한다.
     * 정산 요청 중(REQUESTED)인 결제가 없을 때만 종료 가능하다.
     * 성공하면 isProgress=false로 전환되며, FE에서 시작 버튼으로 UI가 바뀐다.
     */
    @PostMapping("/{roomId}/end")
    @Operation(summary = "ROOM-18 모임 종료")
    public ResponseEntity<ApiResponseDto<String>> endRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.endRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임이 종료되었습니다."));
    }

    /*
     * [ROOM-15] 방장 권한을 다른 멤버에게 위임한다.
     * 요청자는 반드시 해당 방의 방장이어야 하며,
     * 대상 유저는 해당 방의 참여자여야 한다.
     */
    @PostMapping("/{roomId}/delegations")
    @Operation(summary = "ROOM-15 방장 위임")
    public ResponseEntity<ApiResponseDto<String>> delegateAdmin(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody DelegateAdminRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.delegateAdmin(roomId, currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success("방장 위임이 성공적으로 이루어졌습니다."));
    }

    /*
     * [ROOM-16] 모임 참여 인원을 조회한다.
     * 요청자는 해당 방의 멤버여야 한다.
     */
    @GetMapping("/{roomId}/participants-lists")
    @Operation(summary = "ROOM-16 모임 참여 인원 조회")
    public ResponseEntity<ApiResponseDto<List<RoomParticipantListResponse>>> getParticipantList(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        List<RoomParticipantListResponse> response = roomService.getParticipantList(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /*
    * [ROOM-10] 총무 금액 순위 조회
    */
    @GetMapping("/{roomId}/rankings")
    @Operation(summary =  "ROOM-10 : 총무 금액 순위 조회")
    public ResponseEntity<ApiResponseDto<RoomRankingSnapshotResponse>> getRoomRanking(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        RoomRankingSnapshotResponse response = roomService.getRoomRankingSnapshot(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    /*
     * [ROOM-11] 랭킹 SSE 스트림
     */
    @GetMapping(value = "/{roomId}/rankings/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "ROOM-11: 랭킹 SSE 스트림")
    public SseEmitter streamRoomRanking(
            @PathVariable Long roomId,
            @RequestParam(value = "since", required = false) Long since,
            @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        return roomService.subscribeRoomRanking(roomId, currentUserId, since, lastEventId);
    }

    private Long resolveRequiredUserId(String userIdHeader) {
        if (!StringUtils.hasText(userIdHeader)) {
            throw new CustomException(ErrorCode.COMMON_UNAUTHORIZED);
        }
        try {
            return Long.parseLong(userIdHeader);
        } catch (NumberFormatException ex) {
            throw new CustomException(ErrorCode.COMMON_INVALID_INPUT);
        }
    }
}



