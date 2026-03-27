package com.duckchi.pay.domain.room.scheduler;

import com.duckchi.pay.domain.room.service.RoomRankingEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RoomRankingSseHeartbeatScheduler {

    private final RoomRankingEmitterRegistry roomRankingEmitterRegistry;

    @Scheduled(fixedDelayString = "${room.ranking.sse.heartbeat-ms:25000}")
    public void sendHeartbeat() {
        for (Long roomId : roomRankingEmitterRegistry.getRoomIds()) {
            for (SseEmitter emitter : roomRankingEmitterRegistry.getRoomEmitters(roomId)) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("heartbeat")
                            .data(Map.of("ts", LocalDateTime.now().toString())));
                } catch (Exception e) {
                    try { emitter.completeWithError(e); } catch (Exception ignored) {}
                }
            }
        }
    }
}