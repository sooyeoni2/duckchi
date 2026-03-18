package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.RoomListResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
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
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
@Tag(name = "Room", description = "ROOM API")
public class RoomController {

    private static final String USER_ID_HEADER = "X-User-Id";

    private final RoomService roomService;

    @PostMapping
    @Operation(summary = "ROOM-01 Create room")
    public ResponseEntity<ApiResponseDto<CreateRoomResponse>> createRoom(
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        CreateRoomResponse response = roomService.createRoom(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}/auto-debit/consents")
    @Operation(summary = "ROOM-04 Update auto debit consent")
    public ResponseEntity<ApiResponseDto<UpdateAutoDebitConsentResponse>> updateAutoDebitConsent(
            @PathVariable Long roomId,
            @RequestParam AutoDebitConsentStatus status,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        UpdateAutoDebitConsentResponse response = roomService.updateAutoDebitConsent(roomId, currentUserId, status);
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

    @org.springframework.web.bind.annotation.DeleteMapping("/{roomId}/members/left")
    @Operation(summary = "ROOM-06 모임 방 나가기")
    public ResponseEntity<ApiResponseDto<String>> leaveRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.leaveRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방을 성공적으로 나갔습니다."));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{roomId}/delete")
    @Operation(summary = "ROOM-07 모임 방 삭제")
    public ResponseEntity<ApiResponseDto<String>> deleteRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = USER_ID_HEADER, required = false) String userIdHeader
    ) {
        Long currentUserId = resolveRequiredUserId(userIdHeader);
        roomService.deleteRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방이 성공적으로 삭제되었습니다."));
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