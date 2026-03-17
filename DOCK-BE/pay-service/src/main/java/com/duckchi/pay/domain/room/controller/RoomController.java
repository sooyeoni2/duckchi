package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.dto.response.UpdateAutoDebitConsentResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.domain.room.type.AutoDebitConsentStatus;
import com.duckchi.pay.global.response.ApiResponseDto;
import com.duckchi.pay.infra.security.jwt.JwtUserIdResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    private final RoomService roomService;
    private final JwtUserIdResolver jwtUserIdResolver;

    @PostMapping
    @Operation(summary = "ROOM-01 Create room")
    public ResponseEntity<ApiResponseDto<CreateRoomResponse>> createRoom(
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        CreateRoomResponse response = roomService.createRoom(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}/auto-debit/consents")

    @Operation(summary = "ROOM-04 Update auto debit consent")
    public ResponseEntity<ApiResponseDto<UpdateAutoDebitConsentResponse>> updateAutoDebitConsent(
            @PathVariable Long roomId,
            @RequestParam AutoDebitConsentStatus status,
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        UpdateAutoDebitConsentResponse response = roomService.updateAutoDebitConsent(roomId, currentUserId, status);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}/my-transfer-agree")
    @Operation(summary = "ROOM-14 모임방 자동이체 동의 여부 수정")
    public ResponseEntity<ApiResponseDto<UpdateAutoDebitConsentResponse>> toggleAutoDebitConsent(
            @PathVariable("roomId") Long roomId,
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        UpdateAutoDebitConsentResponse response = roomService.toggleAutoDebitConsent(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}")
    @Operation(summary = "ROOM-05 모임 정보 수정")
    public ResponseEntity<ApiResponseDto<String>> updateRoom(
            @PathVariable Long roomId,
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest request
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        roomService.updateRoomInfo(roomId, currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success("수정이 완료되었습니다."));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{roomId}/members/left")
    @Operation(summary = "ROOM-06 모임 방 나가기")
    public ResponseEntity<ApiResponseDto<String>> leaveRoom(
            @PathVariable Long roomId,
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        roomService.leaveRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방을 성공적으로 나갔습니다."));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{roomId}/delete")
    @Operation(summary = "ROOM-07 모임 방 삭제")
    public ResponseEntity<ApiResponseDto<String>> deleteRoom(
            @PathVariable Long roomId,
            @Parameter(hidden = true) @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        Long currentUserId = jwtUserIdResolver.resolveRequired(authorization);
        roomService.deleteRoom(roomId, currentUserId);
        return ResponseEntity.ok(ApiResponseDto.success("모임 방이 성공적으로 삭제되었습니다."));
    }
}

