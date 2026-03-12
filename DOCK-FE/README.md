# 덕치 (DuckDuck) - Frontend

React Native + Expo 기반 모바일 앱입니다.

## 시작하기

### 사전 준비

- Node.js >= 22.11.0
- npm
- 스마트폰에 **Expo Go** 앱 설치 ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

> Android Studio나 Xcode 없이도 실행 가능합니다.

### 설치

```sh
npm install
```

### 실행

```sh
npx expo start
```

터미널에 QR 코드가 표시됩니다.

- **Android**: Expo Go 앱을 열고 QR 코드를 스캔
- **iOS**: 카메라 앱으로 QR 코드를 스캔

> 개발 PC와 스마트폰이 **같은 Wi-Fi**에 연결되어 있어야 합니다.

### 에뮬레이터로 실행

```sh
# Android 에뮬레이터
npx expo run:android

# iOS 시뮬레이터 (macOS만 가능)
npx expo run:ios
```

## 기술 스택

| 항목 | 버전 |
|------|------|
| React Native | 0.81.5 |
| Expo SDK | 54 |
| TypeScript | ^5.8.3 |
| React Navigation | v7 |
| Zustand | ^5.0.11 |
| Zod | ^4.3.6 |
| Axios | ^1.13.6 |

## 프로젝트 구조

```
src/
├── core/           # 앱 공통 설정 (네비게이션, 테마 등)
│   ├── navigation/
│   └── theme/
├── features/       # 기능별 화면
│   ├── auth/
│   ├── home/
│   ├── onboarding/
│   ├── profile/
│   ├── report/
│   └── room/
└── shared/         # 공통 컴포넌트 및 유틸리티
    ├── components/
    └── ...
```

자세한 폴더 구조는 [fe_docs/folder.md](fe_docs/folder.md)를 참고하세요.

## 경로 별칭

```
@core/*    →  src/core/*
@features/* →  src/features/*
@shared/*  →  src/shared/*
```

## 문서

- [폴더 구조](fe_docs/folder.md)
- [데이터 소스](fe_docs/data_source.md)
