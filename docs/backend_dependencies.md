# 백엔드 의존성 설명 문서

이 문서는 Duckchi 프로젝트의 백엔드 서버별 의존성과 사용 목적을 정리한 문서이다.

현재 백엔드는 다음 5개의 서버로 구성된다.

- discovery-service
- gateway-service
- core-service
- pay-service
- insight-service

---

## 1. discovery-service

서비스 디스커버리 서버이다. 각 마이크로서비스가 자신의 위치를 등록하고, 다른 서비스가 그 위치를 찾을 수 있게 해준다.

### 사용 의존성

#### Eureka Server
- 서비스 디스커버리 서버를 구축하기 위한 의존성
- 각 서비스가 Eureka에 자신을 등록함
- Gateway나 다른 서비스가 이름으로 서버를 찾을 수 있게 해줌

예시:
- `core-service`, `pay-service`, `insight-service`가 Eureka에 등록
- `gateway-service`가 등록된 서비스 목록을 보고 라우팅

#### Spring Boot Actuator
- 서버 상태를 확인하기 위한 의존성
- health check, metrics, info 등의 모니터링 기능 제공

예시:
- `/actuator/health`

#### Lombok
- 반복되는 getter, setter, 생성자 등의 코드를 줄여주는 라이브러리

예시:
- `@Getter`
- `@Setter`
- `@Builder`
- `@NoArgsConstructor`
- `@AllArgsConstructor`

---

## 2. gateway-service

클라이언트 요청을 가장 먼저 받는 API Gateway 서버이다.
모든 요청은 Gateway를 거쳐 각 서비스로 전달된다.

흐름:

```text
Client
  ↓
Gateway
  ↓
Core / Pay / Insight
```

### 사용 의존성

#### Reactive Gateway
- Spring Cloud Gateway를 사용하기 위한 핵심 의존성
- API 라우팅, 필터 처리, 공통 보안 처리에 사용
- MSA 구조에서 각 서비스로 요청을 분배하는 역할

예시:
- `/api/core/**` → `core-service`
- `/api/pay/**` → `pay-service`
- `/api/insight/**` → `insight-service`

#### Eureka Discovery Client
- Gateway가 Eureka에 등록된 서비스 정보를 조회할 수 있게 해주는 의존성
- 서비스 주소를 하드코딩하지 않고 이름 기반으로 찾을 수 있음

#### Spring Security
- 인증과 인가를 처리하기 위한 의존성
- JWT 검증 필터를 Gateway에서 공통으로 둘 때 사용 가능
- 인증이 필요한 요청과 아닌 요청을 구분할 수 있음

#### Spring Boot Actuator
- Gateway 서버 상태 모니터링

#### Lombok
- 반복 코드 제거

---

## 3. core-service

사용자 인증과 공통 기능을 담당하는 서버이다.

담당 기능 예시:
- 로그인
- 회원 정보
- 토큰 발급/재발급
- 알림
- 공통 사용자 기능

### 사용 의존성

#### Spring Web
- 일반적인 REST API 서버를 만들기 위한 의존성
- Controller, RequestMapping, ResponseEntity 등을 사용할 수 있음

예시:
- `POST /auth/login`
- `GET /profile`

#### Spring Data JPA
- 데이터베이스 접근을 쉽게 하기 위한 ORM 의존성
- Entity, Repository 기반으로 DB를 다룰 수 있음
- 직접 SQL을 많이 쓰지 않아도 됨

예시:
- `UserRepository extends JpaRepository<User, Long>`

#### Spring Security
- 인증과 권한 처리를 위한 의존성
- JWT 인증 구조에서 필수적으로 많이 사용됨
- 로그인 이후 사용자 인증 상태를 처리할 수 있음

#### Validation
- 클라이언트 요청값을 검증하기 위한 의존성
- 잘못된 입력을 컨트롤러 단에서 빠르게 막을 수 있음

예시:
- `@NotNull`
- `@NotBlank`
- `@Email`

#### Eureka Discovery Client
- core-service를 Eureka에 등록하기 위한 의존성
- 다른 서비스가 `core-service`라는 이름으로 찾을 수 있음

#### Spring for Apache Kafka
- 서비스 간 이벤트 기반 통신을 위한 의존성
- 동기 호출 대신 비동기 이벤트 전달 가능

예시:
- 인증 완료 이벤트 발행
- 알림 이벤트 수신

#### Spring Data Redis (Access+Driver)
- Redis를 캐시/저장소로 사용하기 위한 의존성
- 토큰 저장, 인증 관련 캐시, 임시 데이터 저장 등에 사용 가능

예시:
- Refresh Token 저장
- 인증번호 저장
- 캐시 데이터 저장

#### MySQL Driver
- MySQL 데이터베이스와 연결하기 위한 드라이버
- JPA가 실제 DB와 통신할 수 있게 해줌

#### Spring Boot Actuator
- core-service 상태 모니터링

#### Lombok
- 반복 코드 제거

---

## 4. pay-service

결제와 정산 관련 기능을 담당하는 서버이다.

담당 기능 예시:
- 모임방
- 장바구니
- 결제 등록
- 정산 요청
- 자동이체

### 사용 의존성

#### Spring Web
- REST API 제공

예시:
- `POST /rooms`
- `POST /settlements`
- `GET /payments`

#### Spring Data JPA
- 결제/정산/모임 데이터 저장
- 엔티티 중심으로 데이터 관리 가능

#### Validation
- 요청값 검증
- 금액, 인원 수, 필수 입력값 등을 확인하는 데 사용

#### Eureka Discovery Client
- pay-service를 Eureka에 등록

#### Spring for Apache Kafka
- 정산 완료, 결제 완료 같은 이벤트를 다른 서비스에 전달

예시:
- 결제 완료 → Insight 서버로 이벤트 전송

#### Spring Data Redis (Access+Driver)
- 정산 과정에서 임시 데이터 저장
- 실시간 순위나 캐시성 데이터 저장 가능

예시:
- 실시간 정산 대기 데이터
- 자주 조회되는 캐시 데이터

#### OpenFeign
- 다른 마이크로서비스를 HTTP API로 쉽게 호출하기 위한 의존성
- 내부 서비스 통신을 더 간단하게 만들 수 있음

예시:
- Pay → Core 사용자 정보 조회
- Pay → Core 알림 요청

#### MySQL Driver
- MySQL 연결

#### Spring Boot Actuator
- pay-service 상태 모니터링

#### Lombok
- 반복 코드 제거

---

## 5. insight-service

소비 분석과 통계, 게이미피케이션을 담당하는 서버이다.

담당 기능 예시:
- 소비 패턴 분석
- 월별 통계
- 랭킹
- 뱃지
- 게이미피케이션

### 사용 의존성

#### Spring Web
- 분석 결과를 조회하는 REST API 제공

예시:
- `GET /analytics/monthly`
- `GET /ranking`

#### Spring Data JPA
- 분석 결과, 통계 데이터, 스냅샷 데이터 저장

#### Spring Batch
- 대량 데이터 처리와 배치 작업을 위한 의존성
- 월별 통계 집계, 랭킹 갱신 등에 적합함

예시:
- 월말 소비 통계 배치
- 정기 랭킹 집계

#### Spring Data Redis (Access+Driver)
- 실시간 순위, 캐시성 분석 결과 저장

예시:
- 실시간 랭킹
- 자주 조회되는 통계 캐시

#### Eureka Discovery Client
- insight-service를 Eureka에 등록

#### Spring for Apache Kafka
- 다른 서비스에서 발생한 이벤트를 받아 분석에 활용

예시:
- 결제 완료 이벤트 수신
- 정산 완료 이벤트 수신

#### MySQL Driver
- MySQL 연결

#### Spring Boot Actuator
- insight-service 상태 모니터링

#### Lombok
- 반복 코드 제거

---

## 6. 서버별 의존성 요약

### discovery-service
- Eureka Server
- Spring Boot Actuator
- Lombok

### gateway-service
- Reactive Gateway
- Eureka Discovery Client
- Spring Security
- Spring Boot Actuator
- Lombok

### core-service
- Spring Web
- Spring Data JPA
- Spring Security
- Validation
- Eureka Discovery Client
- Spring for Apache Kafka
- Spring Data Redis (Access+Driver)
- MySQL Driver
- Spring Boot Actuator
- Lombok

### pay-service
- Spring Web
- Spring Data JPA
- Validation
- Eureka Discovery Client
- Spring for Apache Kafka
- Spring Data Redis (Access+Driver)
- OpenFeign
- MySQL Driver
- Spring Boot Actuator
- Lombok

### insight-service
- Spring Web
- Spring Data JPA
- Spring Batch
- Spring Data Redis (Access+Driver)
- Eureka Discovery Client
- Spring for Apache Kafka
- MySQL Driver
- Spring Boot Actuator
- Lombok

---

## 7. 전체 구조 한눈에 보기

```text
Client
  ↓
Gateway
  ↓
Core / Pay / Insight
  ↓
MySQL / Redis / Kafka
```

- Gateway: 요청 진입점
- Eureka: 서비스 위치 관리
- Core: 인증/공통
- Pay: 결제/정산
- Insight: 분석/통계
- MySQL: 영속 데이터 저장
- Redis: 캐시/임시 데이터
- Kafka: 서비스 간 이벤트 전달

---

## 8. 정리

이 의존성들은 단순히 많이 넣은 것이 아니라, 각 서버의 역할에 맞게 선택한 것이다.

- Discovery는 서비스 등록과 탐색
- Gateway는 요청 라우팅과 공통 필터
- Core는 인증과 사용자 공통 기능
- Pay는 정산과 결제 처리
- Insight는 통계와 소비 분석

따라서 서버별 의존성은 서로 다를 수밖에 없고, 각자의 책임에 맞게 최소한으로 구성하는 것이 중요하다.

