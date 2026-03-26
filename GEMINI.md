# GEMINI.md - Duckchi (덕치) Project Context

## Project Overview
**Duckchi (덕치)** is a group payment and settlement management application. It features a microservice architecture on the backend and a React Native (Expo) mobile application on the frontend. The project emphasizes group "rooms" where payments can be recorded (manually or via OCR) and settled among members.

### Core Architecture
- **Backend:** Spring Cloud microservices (Discovery, Gateway, Core, Pay, Insight).
- **Frontend:** React Native (Expo) with a feature-first MVVM (Model-View-ViewModel) architecture.

---

## Technical Stack

### Frontend (DOCK-FE)
- **Framework:** React Native (Expo SDK 54+)
- **Language:** TypeScript
- **State Management:** Zustand
- **Navigation:** React Navigation (Native Stack, Bottom Tabs)
- **Networking:** Axios
- **Validation:** Zod
- **Styling:** Vanilla CSS / React Native StyleSheet

### Backend (DOCK-BE)
- **Language:** Java 17
- **Framework:** Spring Boot 3.5.x, Spring Cloud (Eureka, OpenFeign, Gateway)
- **Database:** MySQL, Redis
- **Messaging:** Apache Kafka
- **Documentation:** SpringDoc OpenAPI (Swagger)
- **Build Tool:** Gradle

---

## Building and Running

### Frontend (DOCK-FE)
```bash
# Navigate to frontend directory
cd DOCK-FE

# Install dependencies
npm install

# Start Expo dev server
npm start

# Run on Android/iOS
npm run android
npm run ios

# Type checking
npx tsc --noEmit
```

### Backend (DOCK-BE)
```bash
# Build a specific service (e.g., pay-service)
cd DOCK-BE/pay-service
./gradlew build

# Run via Docker (Root directory)
docker-compose -f docker-compose.local.yml up -d
```

---

## Development Conventions

### General Guidelines
- **Mobile First:** Mobile UX is the default priority.
- **Preserve Flow:** Do not change existing application flows without explicit instruction.
- **Commit Hygiene:** One concern per commit. Use descriptive commit messages.

### Frontend Architecture (MVVM + Feature-first)
- **Views:** Handle rendering and event wiring.
- **ViewModels:** Manage state, drafts, and UI logic (using hooks).
- **Models:** Handle API calls (`*Api.ts`), DTO mapping (`*Mappers.ts`), and service orchestration (`*Service.ts`).
- **Feature Structure:** Keep feature-related logic under `src/features/{feature_name}`.

### Backend Guidelines
- **Microservice Isolation:** Ensure services communicate primarily via OpenFeign or Kafka.
- **Validation:** Use `spring-boot-starter-validation` for request DTOs.
- **Documentation:** Maintain Swagger annotations for API clarity.

### Conflict & Merge Rules
- **Strategic Merging:** Before merging `develop`, analyze and explain potential conflict points.
- **Permission:** Always ask for user permission before executing a merge.
- **Priority:** Preserve functional user flows over stylistic changes during conflict resolution.

---

## Key Files & Paths
- **Frontend Core:** `DOCK-FE/src/features/`
- **Room Management:** `DOCK-FE/src/features/room/views/RoomScreen.tsx`
- **Room Navigation:** `DOCK-FE/src/features/room/RoomNavigator.tsx`
- **Payment Feature:** `DOCK-FE/src/features/payment/`
- **Backend Services:** `DOCK-BE/`
- **Project Documentation:** `.ai/`
