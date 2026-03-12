# 📁 폴더 구조 가이드

## ✅ 목적
Feature-First 구조를 기반으로 MVVM 패턴을 적용하여
직관적이고 유지보수가 쉬운 React Native 프로젝트 구조를 제공합니다.

---

## 🧱 설계 원칙
- **기능별 독립성**: 각 Feature는 독립적으로 개발/테스트 가능
- **3계층 분리**: Model, ViewModel, View 명확히 구분
- **단방향 데이터 흐름**: View → ViewModel → Model
- **단순함 우선**: 불필요한 추상화 없이 직관적인 구조

---

## ✅ MVVM 레이어 역할

| 레이어 | 역할 | 파일 |
|--------|------|------|
| **Model** | API 통신, 타입 정의 | `{name}Service.ts`, `{name}Types.ts` |
| **ViewModel** | 상태 관리, 비즈니스 로직 | `use{Name}ViewModel.ts` |
| **View** | UI 렌더링, 사용자 입력 | `{Name}Screen.tsx`, `components/` |

---

## ✅ 기술 스택

| 역할 | 선택 |
|-----|------|
| 언어 | TypeScript |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 네비게이션 | React Navigation |
| 타입 검증 | Zod |
| ViewModel | 커스텀 훅 (useXxxViewModel) |

---

## ✅ 전체 폴더 구조

```
src/
├── core/                           # 공통 기능
│   ├── constants/
│   │   ├── apiConstants.ts         # API URL, endpoint, timeout 등
│   │   └── appConstants.ts         # 앱 전역 상수
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── theme.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── types.ts
│   ├── network/
│   │   ├── axiosClient.ts
│   │   └── interceptors/
│   │       ├── authInterceptor.ts
│   │       └── errorInterceptor.ts
│   └── utils/
│       ├── dateUtils.ts
│       ├── validatorUtils.ts
│       └── formatUtils.ts
│
├── features/                       # 기능별 폴더
│   ├── auth/
│   │   ├── models/
│   │   │   ├── authTypes.ts        # 타입 정의
│   │   │   └── authService.ts      # API 호출 함수
│   │   ├── viewmodels/
│   │   │   └── useLoginViewModel.ts
│   │   └── views/
│   │       ├── LoginScreen.tsx
│   │       └── components/
│   │           └── LoginForm.tsx
│   │
│   ├── gathering/                  # 모임방
│   ├── payment/                    # 결제/정산
│   ├── nbang/                      # N빵 뽑기
│   ├── spendReport/                # 소비 리포트
│   └── profile/                    # 프로필
│
└── shared/                         # 공유 컴포넌트
    ├── components/
    │   ├── navigation/
    │   │   └── BottomTabBar.tsx
    │   ├── buttons/
    │   │   ├── PrimaryButton.tsx
    │   │   └── OutlineButton.tsx
    │   ├── inputs/
    │   │   ├── CustomTextInput.tsx
    │   │   └── SearchInput.tsx
    │   ├── loading/
    │   │   ├── LoadingIndicator.tsx
    │   │   └── LoadingOverlay.tsx
    │   ├── feedback/
    │   │   ├── ErrorView.tsx
    │   │   └── EmptyView.tsx
    │   └── layout/
    │       └── SafeAreaContainer.tsx
    └── types/
        ├── Pagination.ts
        └── ApiResponse.ts
```

---

## ✅ 각 레이어별 파일 구성

### Model Layer (`models/`)
```
{feature_name}/models/
├── {name}Types.ts       # 타입 정의 (API 응답 타입, 앱 내부 타입)
└── {name}Service.ts     # API 호출 함수 모음
```

### ViewModel Layer (`viewmodels/`)
```
{feature_name}/viewmodels/
└── use{Name}ViewModel.ts   # 상태 + 비즈니스 로직
```

### View Layer (`views/`)
```
{feature_name}/views/
├── {Name}Screen.tsx         # 화면
└── components/              # 화면별 컴포넌트
    ├── {ComponentName}.tsx
    └── ...
```

---

## ✅ 파일 네이밍 규칙

| 타입 | 패턴 | 예시 |
|------|------|------|
| Screen | `{Name}Screen.tsx` | `GatheringListScreen.tsx` |
| ViewModel 훅 | `use{Name}ViewModel.ts` | `useGatheringListViewModel.ts` |
| Service | `{name}Service.ts` | `gatheringService.ts` |
| Types | `{name}Types.ts` | `gatheringTypes.ts` |
| Component | `{Name}.tsx` | `GatheringCard.tsx` |

---

## ✅ Import 순서

```typescript
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. 서드파티 라이브러리 (알파벳 순)
import { NavigationProp } from '@react-navigation/native';
import { create } from 'zustand';

// 3. 프로젝트 내부 - core
import { axiosClient } from '@core/network/axiosClient';
import { colors } from '@core/theme/colors';

// 4. 프로젝트 내부 - features (상대 경로)
import { getGatherings } from '../models/gatheringService';
import { useGatheringListViewModel } from '../viewmodels/useGatheringListViewModel';

// 5. 프로젝트 내부 - shared
import { PrimaryButton } from '@shared/components/buttons/PrimaryButton';

// 6. 타입만 import
import type { RootStackParamList } from '@core/navigation/types';
```

---

## ✅ tsconfig.json 경로 별칭

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@features/*": ["src/features/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

---

## ✅ 새 Feature 추가 체크리스트

### 1️⃣ 폴더 구조 생성
```bash
mkdir -p src/features/{feature_name}/models
mkdir -p src/features/{feature_name}/viewmodels
mkdir -p src/features/{feature_name}/views/components
```

### 2️⃣ Model Layer 작성
- [ ] 타입 정의 (`{name}Types.ts`)
- [ ] API 호출 함수 작성 (`{name}Service.ts`)

### 3️⃣ ViewModel Layer 작성
- [ ] ViewModel 훅 작성 (`use{Name}ViewModel.ts`)

### 4️⃣ View Layer 작성
- [ ] Screen 작성 (`{Name}Screen.tsx`)
- [ ] 필요한 Component 작성 (`components/`)

### 5️⃣ Navigation 등록
- [ ] `types.ts`에 Screen 파라미터 타입 추가
- [ ] Navigator에 Screen 등록

---

## 📎 관련 문서
- **네이밍 규칙**: `naming.md`
- **타입/Service 설계**: `model.md`
- **State 관리**: `state.md`
- **ViewModel 설계**: `viewmodel.md`
- **Screen 설계**: `screen.md`
- **Component 설계**: `component.md`
