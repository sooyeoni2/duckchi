package com.duckchi.core.infra.redis.dto;

import static com.duckchi.core.infra.redis.OneVerifyRedisRepository.STATUS_LOCKED;

public record OneVerifyCacheEntry(
        String status, //계좌 인증 상태 (PENDING/LOCKED)
        int failCount, //실패 횟수 (3회면 24h LOCKED)
        String accountNo, //계좌번호
        Long userId, //유저ID
        String requestedAt //요청 일시
) {
    public boolean isLocked(){
        return STATUS_LOCKED.equals(status);
    }
}
