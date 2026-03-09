# 📁 폴더 구조 가이드

## ✅ 목적
Feature-First 구조를 기반으로 각 기능별로 Clean Architecture의 레이어를 구성하여
확장 가능하고 유지보수가 용이한 React Native 프로젝트 구조를 제공합니다.

---

## 🧱 설계 원칙
- **기능별 독립성**: 각 Feature는 독립적으로 개발/테스트 가능
- **레이어 분리**: Data, Domain, Presentation 레이어 명확히 구분
- **단방향 의존성**: 상위 레이어(Presentation) → 하위 레이어(Domain → Data)로만 의존
- **Mapper 분리**: DTO와 Entity 변환은 Mapper가 전담

---

## ✅ 기술 스택

| 역할 | 선택 |
|-----|------|
| 언어 | TypeScript |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 네비게이션 | React Navigation |
| 타입 정의/직렬화 검증 | TypeScript 인터페이스 + Zod |
| ViewModel | 커스텀 훅 (useXxxViewModel) |

---

## ✅ 전체 폴더 구조

```
src/
├── core/                           # 공통 기능
│   ├── constants/                  # 상수 정의
│   │   ├── apiConstants.ts         # API URL, endpoint, timeout 등
│   │   └── appConstants.ts         # 앱 전역 상수 (버전, 설정값 등)
│   ├── theme/                      # 테마 관련
│   │   ├── colors.ts               # 색상 정의
│   │   ├── typography.ts           # 폰트 스타일
│   │   └── theme.ts                # 테마 통합
│   ├── navigation/                 # ✨ React Navigation 설정
│   │   ├── RootNavigator.tsx       # 루트 네비게이터 (인증 분기)
│   │   ├── AppNavigator.tsx        # 인증 후 네비게이터 (Bottom Tab)
│   │   ├── AuthNavigator.tsx       # 인증 전 Stack 네비게이터
│   │   └── types.ts                # 네비게이션 타입 정의
│   ├── network/                    # 네트워크 설정
│   │   ├── axiosClient.ts          # Axios 인스턴스 생성 및 설정
│   │   └── interceptors/
│   │       ├── authInterceptor.ts  # 토큰 주입/갱신
│   │       └── errorInterceptor.ts # 에러 핸들링
│   ├── utils/                      # 유틸리티 함수
│   │   ├── dateUtils.ts
│   │   ├── validatorUtils.ts
│   │   └── formatUtils.ts
│   └── errors/                     # 에러 정의
│       ├── AppError.ts             # 커스텀 에러 클래스
│       └── errorTypes.ts           # 에러 타입 상수
│
├── features/                       # 기능별 폴더
│   ├── auth/
│   │   ├── data/
│   │   │   ├── login/
│   │   │   │   ├── dataSource/
│   │   │   │   │   ├── ILoginDataSource.ts          # 인터페이스
│   │   │   │   │   ├── LoginDataSourceImpl.ts       # API 구현
│   │   │   │   │   └── MockLoginDataSource.ts       # Mock 구현
│   │   │   │   ├── loginDto.ts                      # DTO + Zod 스키마
│   │   │   │   ├── loginMapper.ts                   # DTO ↔ Entity 변환
│   │   │   │   └── LoginRepositoryImpl.ts           # Repository 구현
│   │   │   └── registration/
│   │   ├── domain/
│   │   │   ├── login/
│   │   │   │   ├── LoginEntity.ts                   # Entity 타입
│   │   │   │   └── ILoginRepository.ts              # Repository 인터페이스
│   │   │   └── registration/
│   │   └── presentation/
│   │       ├── login/
│   │       │   ├── LoginScreen.tsx                  # 화면
│   │       │   ├── useLoginViewModel.ts             # ViewModel 훅
│   │       │   └── components/                      # 화면별 컴포넌트
│   │       │       └── LoginForm.tsx
│   │       └── registration/
│   │
│   ├── gathering/                  # 모임방
│   │   ├── data/
│   │   │   ├── gathering_list/
│   │   │   │   ├── dataSource/
│   │   │   │   │   ├── IGatheringDataSource.ts
│   │   │   │   │   ├── GatheringDataSourceImpl.ts
│   │   │   │   │   └── MockGatheringDataSource.ts
│   │   │   │   ├── gatheringDto.ts
│   │   │   │   ├── gatheringMapper.ts
│   │   │   │   └── GatheringRepositoryImpl.ts
│   │   │   └── gathering_detail/
│   │   ├── domain/
│   │   │   ├── gathering_list/
│   │   │   │   ├── GatheringEntity.ts
│   │   │   │   └── IGatheringRepository.ts
│   │   │   └── gathering_detail/
│   │   │       └── usecases/
│   │   │           └── DelegateHostUseCase.ts       # 방장 위임
│   │   └── presentation/
│   │       ├── gathering_list/
│   │       │   ├── GatheringListScreen.tsx
│   │       │   ├── useGatheringListViewModel.ts
│   │       │   └── components/
│   │       │       └── GatheringCard.tsx
│   │       └── gathering_detail/
│   │           ├── GatheringDetailScreen.tsx
│   │           ├── useGatheringDetailViewModel.ts
│   │           └── components/
│   │
│   ├── payment/                    # 결제/정산
│   │   ├── data/
│   │   │   ├── receipt_scan/       # OCR 영수증 스캔
│   │   │   │   ├── dataSource/
│   │   │   │   │   ├── IReceiptScanDataSource.ts
│   │   │   │   │   ├── ReceiptScanDataSourceImpl.ts
│   │   │   │   │   └── MockReceiptScanDataSource.ts
│   │   │   │   ├── receiptScanDto.ts
│   │   │   │   ├── receiptScanMapper.ts
│   │   │   │   └── ReceiptScanRepositoryImpl.ts
│   │   │   └── payment_list/
│   │   ├── domain/
│   │   │   ├── receipt_scan/
│   │   │   │   ├── ReceiptScanEntity.ts
│   │   │   │   └── IReceiptScanRepository.ts
│   │   │   └── payment_list/
│   │   │       └── usecases/
│   │   │           └── AssignMenuMembersUseCase.ts  # 메뉴별 멤버 지정
│   │   └── presentation/
│   │       ├── receipt_scan/
│   │       │   ├── ReceiptScanScreen.tsx
│   │       │   ├── useReceiptScanViewModel.ts
│   │       │   └── components/
│   │       │       ├── ReceiptItemList.tsx
│   │       │       └── MemberAssignModal.tsx
│   │       └── payment_list/
│   │
│   ├── nbang/                      # N빵 뽑기
│   │   ├── data/
│   │   │   └── nbang_draw/
│   │   │       ├── dataSource/
│   │   │       │   ├── INbangDrawDataSource.ts
│   │   │       │   ├── NbangDrawDataSourceImpl.ts
│   │   │       │   └── MockNbangDrawDataSource.ts
│   │   │       ├── nbangDrawDto.ts
│   │   │       ├── nbangDrawMapper.ts
│   │   │       └── NbangDrawRepositoryImpl.ts
│   │   ├── domain/
│   │   │   └── nbang_draw/
│   │   │       ├── NbangDrawEntity.ts
│   │   │       └── INbangDrawRepository.ts
│   │   └── presentation/
│   │       └── nbang_draw/
│   │           ├── NbangDrawScreen.tsx
│   │           ├── useNbangDrawViewModel.ts
│   │           └── components/
│   │               ├── DrawCardGrid.tsx
│   │               └── DrawResultCard.tsx
│   │
│   ├── spendReport/                # 소비 리포트
│   └── profile/                    # 프로필
│
└── shared/                         # 공유 컴포넌트
    ├── components/                 # 공통 컴포넌트
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
    └── types/                      # 공통 타입
        ├── Pagination.ts
        └── ApiResponse.ts
```

---

## ✅ 각 레이어별 파일 구성

### Data Layer (`data/`)
```
{feature_name}/data/{sub_feature}/
├── dataSource/
│   ├── I{Name}DataSource.ts           # 인터페이스
│   ├── {Name}DataSourceImpl.ts        # API 구현
│   └── Mock{Name}DataSource.ts        # Mock 구현
├── {name}Dto.ts                       # DTO + Zod 스키마 정의
├── {name}Mapper.ts                    # DTO ↔ Entity 변환
└── {Name}RepositoryImpl.ts            # Repository 구현
```

### Domain Layer (`domain/`)
```
{feature_name}/domain/{sub_feature}/
├── {Name}Entity.ts                    # Entity 타입 정의
├── I{Name}Repository.ts               # Repository 인터페이스
└── usecases/                          # UseCase (복잡한 로직만)
    └── {Action}{Name}UseCase.ts
```

### Presentation Layer (`presentation/`)
```
{feature_name}/presentation/{sub_feature}/
├── {Name}Screen.tsx                   # 화면
├── use{Name}ViewModel.ts              # ViewModel 훅
└── components/                        # 화면별 컴포넌트
    ├── {ComponentName}.tsx
    └── ...
```

---

## ✅ 파일 네이밍 규칙

| 타입 | 패턴 | 예시 |
|------|------|------|
| Screen | `{Name}Screen.tsx` | `GatheringListScreen.tsx` |
| ViewModel 훅 | `use{Name}ViewModel.ts` | `useGatheringListViewModel.ts` |
| Entity | `{Name}Entity.ts` | `GatheringEntity.ts` |
| Repository 인터페이스 | `I{Name}Repository.ts` | `IGatheringRepository.ts` |
| Repository 구현 | `{Name}RepositoryImpl.ts` | `GatheringRepositoryImpl.ts` |
| DataSource 인터페이스 | `I{Name}DataSource.ts` | `IGatheringDataSource.ts` |
| DataSource 구현 | `{Name}DataSourceImpl.ts` | `GatheringDataSourceImpl.ts` |
| DTO | `{name}Dto.ts` | `gatheringDto.ts` |
| Mapper | `{name}Mapper.ts` | `gatheringMapper.ts` |
| Component | `{Name}.tsx` | `GatheringCard.tsx`, `MemberAssignModal.tsx` |
| UseCase | `{Action}{Name}UseCase.ts` | `DelegateHostUseCase.ts` |

---

## ✅ Import 순서

```typescript
// 1. React/React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. 서드파티 라이브러리 (알파벳 순)
import { NavigationProp } from '@react-navigation/native';
import axios from 'axios';
import { create } from 'zustand';

// 3. 프로젝트 내부 - core
import { axiosClient } from '@core/network/axiosClient';
import { colors } from '@core/theme/colors';

// 4. 프로젝트 내부 - features (상대 경로)
import { GatheringEntity } from '../../domain/gathering_list/GatheringEntity';
import { useGatheringListViewModel } from './useGatheringListViewModel';

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
mkdir -p src/features/{feature_name}/data/{sub_feature}/dataSource
mkdir -p src/features/{feature_name}/domain/{sub_feature}/usecases
mkdir -p src/features/{feature_name}/presentation/{sub_feature}/components
```

### 2️⃣ Domain Layer 작성
- [ ] Entity 타입 정의 (`{Name}Entity.ts`)
- [ ] Repository 인터페이스 정의 (`I{Name}Repository.ts`)

### 3️⃣ Data Layer 작성
- [ ] DTO + Zod 스키마 정의 (`{name}Dto.ts`)
- [ ] Mapper 작성 (`{name}Mapper.ts`)
- [ ] DataSource 인터페이스 (`I{Name}DataSource.ts`)
- [ ] DataSource 구현 (`{Name}DataSourceImpl.ts`)
- [ ] Repository 구현 (`{Name}RepositoryImpl.ts`)

### 4️⃣ Presentation Layer 작성
- [ ] ViewModel 훅 작성 (`use{Name}ViewModel.ts`)
- [ ] Screen 작성 (`{Name}Screen.tsx`)
- [ ] 필요한 Component 작성 (`components/`)

### 5️⃣ Navigation 등록
- [ ] `types.ts`에 Screen 파라미터 타입 추가
- [ ] Navigator에 Screen 등록

---

## 📎 관련 문서
- **네이밍 규칙**: `naming.md`
- **DTO 설계**: `dto.md`
- **Mapper 설계**: `mapper.md`
- **DataSource 설계**: `data_source.md`
- **State 관리**: `state.md`
- **ViewModel 설계**: `viewmodel.md`
- **Screen 설계**: `screen.md`
- **Component 설계**: `component.md`
- **UseCase 설계**: `usecase.md`