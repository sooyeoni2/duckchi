package com.duckchi.pay.domain.room.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class RoomRankingEmitterRegistry {

    private final Map<Long, Map<Long, Set<SseEmitter>>> emittersByRoom = new ConcurrentHashMap<>();

    public void add(Long roomId, Long userId, SseEmitter emitter) {
        emittersByRoom
                .computeIfAbsent(roomId, key -> new ConcurrentHashMap<>())
                .computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet())
                .add(emitter);
    }

    public void remove(Long roomId, Long userId, SseEmitter emitter) {
        Map<Long, Set<SseEmitter>> emittersByUser = emittersByRoom.get(roomId);
        if (emittersByUser == null) {
            return;
        }

        Set<SseEmitter> userEmitters = emittersByUser.get(userId);
        if (userEmitters == null) {
            return;
        }

        userEmitters.remove(emitter);

        if (userEmitters.isEmpty()) {
            emittersByUser.remove(userId);
        }

        if (emittersByUser.isEmpty()) {
            emittersByRoom.remove(roomId);
        }
    }

    public List<SseEmitter> getRoomEmitters(Long roomId) {
        Map<Long, Set<SseEmitter>> emittersByUser = emittersByRoom.get(roomId);
        if (emittersByUser == null || emittersByUser.isEmpty()) {
            return List.of();
        }

        List<SseEmitter> flattened = new ArrayList<>();
        for (Set<SseEmitter> emitters : emittersByUser.values()) {
            flattened.addAll(emitters);
        }
        return flattened;
    }

    public Set<Long> getRoomIds() {
        return Set.copyOf(emittersByRoom.keySet());
    }

    public void clearRoom(Long roomId) {
        emittersByRoom.remove(roomId);
    }
}
