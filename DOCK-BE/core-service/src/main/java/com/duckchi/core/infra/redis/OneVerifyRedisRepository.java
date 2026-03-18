package com.duckchi.core.infra.redis;

import com.duckchi.core.infra.redis.dto.OneVerifyCacheEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Repository
@RequiredArgsConstructor
public class OneVerifyRedisRepository {

    private static final String KEY_PREFIX = "account:verify:";
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_FAIL_COUNT = "failCount";
    private static final String FIELD_ACCOUNT_NO = "accountNo";
    private static final String FIELD_USER_ID = "userId";
    private static final String FIELD_REQUESTED_AT = "requestedAt";

    private static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_LOCKED = "LOCKED";

    private final StringRedisTemplate stringRedisTemplate;

    //key 설정 메서드
    private String key(Long accountId){
        return KEY_PREFIX + accountId;
    }

    //인증 대기 상태 저장 메서드
    public void savePending(Long accountId,Long userId, String accountNo, Duration ttl) {
        String key = key(accountId); //accountId로 key 가져오기

        HashOperations<String, Object, Object> hashOps = stringRedisTemplate.opsForHash();
        hashOps.put(key, FIELD_STATUS, STATUS_PENDING);
        hashOps.put(key, FIELD_FAIL_COUNT, "0");
        hashOps.put(key, FIELD_ACCOUNT_NO, accountNo);
        hashOps.put(key, FIELD_USER_ID, String.valueOf(userId));
        hashOps.put(key, FIELD_REQUESTED_AT, LocalDateTime.now().toString());

        stringRedisTemplate.expire(key, ttl);
    }
    //인증 상태 조회 메서드
    public Optional<OneVerifyCacheEntry> find(Long accountId) {
        String key = key(accountId);

        if (!stringRedisTemplate.hasKey(key)) {
            return Optional.empty();
        }

        HashOperations<String, Object, Object> hashOps = stringRedisTemplate.opsForHash();
        Map<Object, Object> values = hashOps.entries(key);

        if (values.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(new OneVerifyCacheEntry(
                (String) values.getOrDefault(FIELD_STATUS, STATUS_PENDING),
                Integer.parseInt((String) values.getOrDefault(FIELD_FAIL_COUNT, "0")),
                (String) values.getOrDefault(FIELD_ACCOUNT_NO, ""),
                Long.parseLong((String) values.getOrDefault(FIELD_USER_ID, "0")),
                (String) values.getOrDefault(FIELD_REQUESTED_AT, "")
        ));
    }
    //실패 횟수 증가 메서드
    public int increaseFailCount(Long accountId) {
        String key = key(accountId);

        HashOperations<String, Object, Object> hashOps = stringRedisTemplate.opsForHash();
        Long updated = hashOps.increment(key, FIELD_FAIL_COUNT, 1); //원자적으로 failCount 증가

        return updated.intValue();
    }
    //실패 횟수 3회 이상 시 lock 처리 메서드
    public void lock(Long accountId, Duration ttl) {
        String key = key(accountId);

        HashOperations<String, Object, Object> hashOps = stringRedisTemplate.opsForHash();
        hashOps.put(key, FIELD_STATUS, STATUS_LOCKED);

        stringRedisTemplate.expire(key, ttl);
    }
    //redis 키 삭제 메서드
    public void delete(Long accountId) {
        stringRedisTemplate.delete(key(accountId));
    }

    //이 account로 계좌 있는지 확인하는 메서드
    public boolean exists(Long accountId) {
        return stringRedisTemplate.hasKey(key(accountId));
    }

    //ttl 남은시간 계산하는 메서드
    public long getRemainingLockSeconds(Long accountId) {
        long ttl = stringRedisTemplate.getExpire(key(accountId), TimeUnit.SECONDS);

        if (ttl < 0) {
            return 0L;
        }

        return ttl;
    }


}
