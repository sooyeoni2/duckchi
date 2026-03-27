package com.duckchi.pay.domain.room.service;

import com.duckchi.pay.domain.room.dto.response.RoomRankingUpdateEventResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.NavigableMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RoomRankingEventCache {

    private final int maxEventsPerRoom;

    private final ConcurrentHashMap<Long, ConcurrentSkipListMap<Long, RoomRankingUpdateEventResponse>> eventsByRoom =
            new ConcurrentHashMap<>();

    public RoomRankingEventCache(
            @Value("${room.ranking.sse.replay-size:200}") int maxEventsPerRoom
    ) {
        this.maxEventsPerRoom = Math.max(maxEventsPerRoom, 1);
    }

    public void add(Long roomId, RoomRankingUpdateEventResponse event) {
        if (roomId == null || event == null) {
            return;
        }

        ConcurrentSkipListMap<Long, RoomRankingUpdateEventResponse> roomEvents =
                eventsByRoom.computeIfAbsent(roomId, key -> new ConcurrentSkipListMap<>());

        roomEvents.put(event.revision(), event);
        trimToLimit(roomEvents);
    }

    public List<RoomRankingUpdateEventResponse> findAfter(Long roomId, long cursorRevision) {
        ConcurrentSkipListMap<Long, RoomRankingUpdateEventResponse> roomEvents = eventsByRoom.get(roomId);
        if (roomEvents == null || roomEvents.isEmpty()) {
            return List.of();
        }

        NavigableMap<Long, RoomRankingUpdateEventResponse> tail = roomEvents.tailMap(cursorRevision, false);
        return new ArrayList<>(tail.values());
    }

    public ReplayWindowStatus getReplayStatus(Long roomId, long cursorRevision) {
        ConcurrentSkipListMap<Long, RoomRankingUpdateEventResponse> roomEvents = eventsByRoom.get(roomId);
        if (roomEvents == null || roomEvents.isEmpty()) {
            return ReplayWindowStatus.EMPTY;
        }

        long min = roomEvents.firstKey();
        long max = roomEvents.lastKey();

        if (cursorRevision < min - 1) {
            return ReplayWindowStatus.OUT_OF_WINDOW;
        }
        if (cursorRevision >= max) {
            return ReplayWindowStatus.UP_TO_DATE;
        }
        return ReplayWindowStatus.REPLAYABLE;
    }

    public void clearRoom(Long roomId) {
        eventsByRoom.remove(roomId);
    }

    private void trimToLimit(ConcurrentSkipListMap<Long, RoomRankingUpdateEventResponse> roomEvents) {
        while (roomEvents.size() > maxEventsPerRoom) {
            Long firstKey = roomEvents.firstKey();
            roomEvents.remove(firstKey);
        }
    }

    public enum ReplayWindowStatus {
        EMPTY,
        OUT_OF_WINDOW,
        REPLAYABLE,
        UP_TO_DATE
    }
}
