# 결제 및 OCR 서비스 성능 개선 및 리팩토링 보고서

## 1. 개요
기존의 `MultipartFile` 기반 OCR 처리 방식에서 발생하는 메모리 부하와 `ExpenseServiceImpl`의 비대한 코드 구조(Fat Service)를 해결하기 위해 아키텍처 개선 및 리팩토링을 수행함.

## 2. OCR 서비스 최적화 (S3 URL 기반)

### 2.1 아키텍처 개선
- **기존**: FE ➔ BE (Base64 전송) ➔ Clova API 호출. 백엔드 메모리(Heap)에 대용량 이미지 데이터가 상주하여 GC 부하 발생.
- **개선**: FE ➔ S3 업로드 ➔ BE (S3 URL 전달) ➔ Clova API (URL 파라미터 활용). 백엔드는 문자열(URL)만 처리하여 메모리 효율 극대화.

### 2.2 성능 최적화 로직
- **정규식 캐싱 (Regex Caching)**: 반복적으로 사용되는 숫자 추출 정규식을 `static final Pattern`으로 사전 컴파일하여 CPU 오버헤드 절감.
- **성능 측정 도입**: Spring `StopWatch`를 활용하여 Clova API 호출 시간과 데이터 정규화(Normalization) 시간을 분리 측정 및 로그 기록.

## 3. 서비스 레이어 리팩토링 (가독성 및 설계)

### 3.1 관심사 분리 (Separation of Concerns)
- **ExpenseValidator**: 약 530라인에 달하던 서비스 코드 중 절반 이상을 차지하던 복잡한 비즈니스 유효성 검증 로직을 별도 컴포넌트로 분리.
- **ExpenseMapper**: JPA 엔티티와 DTO 간의 지루한 변환 로직(Builder 지옥)을 전담 클래스로 이동.

### 3.2 결과
- `ExpenseServiceImpl` 코드 라인 수 **약 50% 감소** (530 lines ➔ 270 lines).
- 각 클래스의 책임이 명확해져 유지보수성 및 단위 테스트 용이성 확보.

## 4. 트러블슈팅 및 환경 설정 지원
- **CORS 설정**: 로컬 웹 환경 테스트를 위한 게이트웨이 CORS 설정 가이드 제공.
- **Android 디버깅**: 안드로이드 실기기 환경에서 로그 확인법(ADB Logcat) 및 카카오 로그인 실패 원인(Key Hash 미등록, Local IP 접근 문제) 분석 및 해결 가이드 제공.

## 5. 결론 및 향후 과제
- **결론**: 백엔드 자원 사용률 최적화와 코드 품질 향상을 동시에 달성함.
- **향후 과제**: Mock JSON 데이터셋을 통한 비용 0원 성능 테스트 환경 구축 및 계좌 내역 조회 성능 최적화 진행 예정.
