package com.duckchi.pay.domain.room.controller;

import com.duckchi.pay.domain.room.dto.request.CreateRoomRequest;
import com.duckchi.pay.domain.room.dto.response.CreateRoomResponse;
import com.duckchi.pay.domain.room.service.RoomService;
import com.duckchi.pay.global.response.ApiResponseDto;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
@Tag(name = "Room", description = "ROOM API")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @Operation(summary = "ROOM-01 모임 방 생성")
    public ResponseEntity<ApiResponseDto<CreateRoomResponse>> createRoom(
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId,
            @Valid @RequestBody CreateRoomRequest request
    ) {
        CreateRoomResponse response = roomService.createRoom(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponseDto.success(response));
    }

    @PatchMapping("/{roomId}")
    @Operation(summary = "ROOM-05 모임 정보 수정")
    public ResponseEntity<ApiResponseDto<String>> updateRoom(
            @PathVariable Long roomId,
            @RequestHeader(value = "X-User-Id", required = false) Long currentUserId,
            @Valid @RequestBody com.duckchi.pay.domain.room.dto.request.UpdateRoomRequest request
    ) {
        roomService.updateRoomInfo(roomId, currentUserId, request);
        return ResponseEntity.ok(ApiResponseDto.success("수정이 완료되었습니다."));
    }
}
