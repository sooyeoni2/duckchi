# 금융망 API 조회 성능 개선 및 Redis 캐싱 도입 보고서

## 1. 개요
금융망 계좌 내역 조회 API의 지연 시간(Latency)을 단축하고 외부 API 호출 비용을 절감하기 위해 Redis 기반의 캐싱 전략을 도입함. 특히 데이터 정합성과 성능 사이의 트레이드오프를 해결하기 위해 'On-Demand Overwrite' 전략을 적용함.

## 2. 캐싱 전략: On-Demand Overwrite

### 2.1 기존 캐싱의 한계 (TTL 기반)
- 단순 TTL(Time To Live) 적용 시, 방금 결제한 내역이 즉시 반영되지 않아 사용자 경험(UX) 저해.
- 새로고침 요청 시에도 캐시된 옛 데이터를 반환하는 문제 발생.

### 2.2 개선된 전략
- **Cache-Aside + Manual Update**: Spring `@Cacheable` 어노테이션 대신 `CacheManager`를 직접 제어.
- **Refresh Flag 도입**: 요청 파라미터에 `refresh=true`가 포함된 경우, 캐시를 무시하고 외부 API를 호출한 뒤 결과를 캐시에 **덮어쓰기(Overwrite)** 수행.
- **결과**: 평상시에는 10ms 이하의 초고속 응답을 보장하며, 필요시 사용자가 직접 최신 데이터를 불러올 수 있는 유연성 확보.

## 3. 성능 측정 지표 (Baseline)

| 테스트 항목 | 측정 지표 (평균) | 비고 |
| :--- | :--- | :--- |
| **Cache MISS / Refresh** | **약 600ms ~ 1,200ms** | 외부 금융망 API 호출 지연 포함 |
| **Cache HIT** | **약 1ms ~ 10ms** | Redis 메모리 기반 조회 |
| **성능 개선율** | **약 98.5% 단축** | 반복 조회 기준 |

## 4. 기술적 구현 내역
- **RedisConfig**: `@EnableCaching` 활성화 및 `test` 프로필용 `ConcurrentMapCacheManager`와 운영용 `RedisCacheManager` 분리 설정.
- **ExpenseServiceImpl**: `StopWatch`를 활용한 단계별(API 호출, 매핑, 캐시 조회) 성능 로그 출력 로직 추가.
- **AccountHistoryRequest**: 캐시 제어를 위한 `refresh` 필드 추가.

## 5. 결론
이번 최적화를 통해 외부 의존성이 높은 금융 API의 성능 병목을 해결하였으며, 사용자 의도에 따라 정합성을 보장할 수 있는 안전한 캐싱 구조를 구축함. 향후 캐시 히트율 모니터링을 통해 최적의 TTL을 도출할 예정.
