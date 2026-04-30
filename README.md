# DuckChi Project

## 소개

DuckChi는 마이크로서비스 아키텍처를 기반으로 한 금융 관리 모바일 애플리케이션입니다. 사용자 인증, 결제 처리, 데이터 인사이트, 알림 기능을 제공합니다.

## 기능

- **사용자 인증 및 관리**: JWT 기반 인증, Firebase 통합
- **결제 서비스**: 안전한 결제 처리
- **데이터 인사이트**: 사용자 데이터 분석 및 시각화
- **알림 시스템**: 실시간 푸시 알림
- **은행 연동**: 계좌 정보 조회 및 관리

## 시스템 아키텍처

![시스템 아키텍처 다이어그램](docs/architecture-diagram.png)

DuckChi 아키텍처는 다음과 같이 구성됩니다.

- 🧑‍💻 개발자는 **GitLab**에 코드를 푸시하고, **Jenkins**가 웹훅 트리거를 통해 **AWS EC2**에서 Docker 이미지를 빌드하고 배포합니다.
- 🌐 **Nginx**는 리버스 프록시로 외부 요청을 받고, 내부 **API Gateway**로 전달합니다.
- 🧭 백엔드 서비스들은 **Eureka**에 등록되어 동적으로 발견되고 라우팅됩니다.
- 🔧 주요 백엔드 서비스:
  - **Core Service**: 인증, 사용자 관리, 알림 처리
  - **Pay Service**: 결제 트랜잭션 처리
  - **Insight Service**: 데이터 분석 및 인사이트 제공
- 📦 비동기 메시징은 **Kafka**로 처리하고, 캐시/세션 데이터는 **Redis**에 저장합니다.
- 🗄️ 데이터는 **AWS RDS(MySQL)**로 분리된 Core DB, Payment DB, Insight DB에 저장됩니다.
- ☁️ 정적 파일과 이미지 저장은 **AWS S3**를 사용합니다.
- 🔌 외부 서비스 연동:
  - **SSAFY 금융 API**
  - **Naver Clova OCR**
  - **Firebase FCM** 푸시 알림
- 📱 모바일 앱은 **React Native** 기반이고, REST API를 통해 백엔드와 통신합니다.
- 📊 모니터링은 **Prometheus**로 수집하고, **Grafana**로 시각화합니다.

### 마이크로서비스 구성

- **Discovery Service**: Eureka 기반 서비스 디스커버리
- **Gateway Service**: API 게이트웨이 및 라우팅
- **Core Service**: 인증, 알림, 사용자 관리
- **Pay Service**: 결제 처리
- **Insight Service**: 데이터 분석 및 인사이트 제공

### 기술 스택

#### 백엔드
- **언어**: Java 17
- **프레임워크**: Spring Boot 3.5.11
- **마이크로서비스**: Spring Cloud (Eureka, OpenFeign)
- **데이터베이스**: JPA, Redis
- **메시징**: Kafka
- **클라우드**: AWS S3, Firebase
- **보안**: JWT
- **모니터링**: Prometheus, Actuator

#### 프론트엔드
- **프레임워크**: React Native, Expo
- **상태 관리**: Zustand
- **네트워킹**: Axios
- **알림**: Firebase Messaging, Notifee
- **저장소**: AsyncStorage

#### 인프라
- **컨테이너화**: Docker, Docker Compose
- **CI/CD**: Jenkins
- **모니터링**: Prometheus

## 설치 및 실행

### 사전 요구사항

- Java 17
- Node.js 18+
- Docker & Docker Compose
- Android Studio (안드로이드 개발용)
- Xcode (iOS 개발용)

### 백엔드 실행

1. 프로젝트 루트로 이동:
   ```bash
   cd DOCK-BE
   ```

2. 각 서비스 빌드:
   ```bash
   ./gradlew build
   ```

3. 로컬 환경 실행:
   ```bash
   docker-compose -f ../docker-compose.local.yml up -d
   ```

### 프론트엔드 실행

1. 프론트엔드 디렉토리로 이동:
   ```bash
   cd DOCK-FE
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. Expo 시작:
   ```bash
   npm start
   ```

4. 안드로이드 실행:
   ```bash
   npm run android
   ```

5. iOS 실행:
   ```bash
   npm run ios
   ```

### 프로덕션 배포

Jenkins 파이프라인을 통해 자동 배포됩니다.

## API 문서

로컬 개발 환경에서 실행 중인 경우 다음 주소에서 Swagger UI를 확인할 수 있습니다.
- Core Service: http://localhost:8081/swagger-ui.html

> 참고: 현재 README에 기재된 주소는 로컬 개발 환경 기준입니다. 실제 운영 서버 주소는 배포 환경 설정에 따라 다릅니다.

## 협업 방식

- 팀 개발 시에는 기능별 브랜치를 생성하고, 코드 리뷰 후 병합합니다.
- 예시 브랜치: `feature/<기능명>` 또는 `hotfix/<이슈명>`.
- 커밋 메시지는 변경 내용을 간결하게 설명합니다.
- Jenkins 파이프라인을 통해 빌드와 배포를 자동화합니다.

## 라이선스

현재 이 저장소에는 별도 라이선스 파일이 포함되어 있지 않습니다. 포트폴리오용 프로젝트로 관리 중이며, 공개 배포 시에는 적절한 라이선스를 추가하는 것이 좋습니다.
