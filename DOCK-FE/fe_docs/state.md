# 🔄 State 설계 가이드

## ✅ 목적
State는 UI의 현재 상태를 표현하는 타입으로,
Zustand를 사용하여 타입 안전하고 예측 가능한 상태 관리를 구현합니다.

---

## 🧱 설계 원칙
- **명확성**: 모든 가능한 상태를 명시적으로 타입으로 정의
- **타입 안전**: TypeScript Discriminated Union으로 상태 전환 보장
- **단순성**: UI에 필요한 최소한의 데이터만 포함
- **불변성**: 상태를 직접 변경하지 않고 새로운 상태 생성

---

## ✅ 파일 구조

State 타입은 ViewModel 파일 내에 함께 정의합니다.

```
src/features/{feature_name}/viewmodels/
└── use{Name}ViewModel.ts    # State 타입 + ViewModel 로직 포함
```

---

## ✅ State 패턴 종류

### 1. Discriminated Union State (비동기 데이터 로딩)
**사용 시기:** API 호출, 데이터 로딩이 있는 경우

```typescript
// features/gathering/viewmodels/useGatheringListViewModel.ts
import type { GatheringItem } from '../models/gatheringTypes';

type GatheringListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; items: GatheringItem[]; hasMore: boolean; currentPage: number; isLoadingMore: boolean }
  | { status: 'error'; message: string }
  | { status: 'empty' };
```

### 2. Form State (폼 입력)
**사용 시기:** 여러 필드를 관리할 때

```typescript
// features/gathering/viewmodels/useGatheringCreateViewModel.ts
interface GatheringCreateState {
  title: string;
  category: string;
  memberIds: number[];
  isSubmitting: boolean;
  errorMessage: string | null;
}

const initialState: GatheringCreateState = {
  title: '',
  category: '기타',
  memberIds: [],
  isSubmitting: false,
  errorMessage: null,
};
```

### 3. Hybrid State (로딩 + 복잡한 데이터)
**사용 시기:** OCR 처리, 카메라 촬영 등 단계가 있는 경우

```typescript
// features/payment/viewmodels/useReceiptScanViewModel.ts
import type { ReceiptItem } from '../models/paymentTypes';

type ReceiptScanState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'processing' }
  | { status: 'result'; receipt: ReceiptItem }
  | { status: 'error'; message: string; canRetry: boolean };
```

---

## ✅ Zustand Store 설계

```typescript
import { create } from 'zustand';

interface GatheringListStore {
  state: GatheringListState;
  setState: (state: GatheringListState) => void;
}

const useGatheringListStore = create<GatheringListStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
}));
```

### 타입 가드 활용
```typescript
const { state } = useGatheringListViewModel();

if (state.status === 'loading') {
  return <LoadingIndicator />;
}
if (state.status === 'error') {
  return <ErrorView message={state.message} />;  // 타입 안전
}
if (state.status === 'loaded') {
  return <GatheringList items={state.items} />;  // 타입 안전
}
```

---

## ✅ Status 값 네이밍

| 상태 | status 값 | 설명 |
|-----|-----------|-----|
| 초기 | `'idle'` | 화면 진입 직후 |
| 로딩 | `'loading'` | 데이터 로딩 중 |
| 성공 | `'loaded'` | 데이터 로드 완료 |
| 에러 | `'error'` | 에러 발생 |
| 빈 값 | `'empty'` | 데이터 없음 |
| 처리 중 | `'processing'` | OCR 처리, 업로드 등 |
| 완료 | `'completed'` | 작업 완료 |
| 결과 | `'result'` | 뽑기 결과 등 |
| 촬영 중 | `'capturing'` | 카메라 촬영 |

---

## ✅ 실전 예시

### 모임방 상세 State
```typescript
type GatheringDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'loaded';
      gathering: GatheringItem;
      isHost: boolean;
      isDelegating: boolean;
    }
  | { status: 'error'; message: string };
```

### N빵 뽑기 State
```typescript
import type { NbangDrawResult } from '../models/nbangTypes';

type NbangDrawState =
  | { status: 'setting'; drawCount: number; paymentIds: number[] }
  | { status: 'drawing' }
  | { status: 'result'; result: NbangDrawResult }
  | { status: 'error'; message: string };
```

### 폼 State (검증 에러 포함)
```typescript
interface GatheringFormState {
  title: string;
  category: string;
  memberIds: number[];
  titleError: string | null;
  memberError: string | null;
  isSubmitting: boolean;
}

export const isGatheringFormValid = (state: GatheringFormState): boolean =>
  state.titleError === null &&
  state.memberError === null &&
  state.title.trim() !== '' &&
  state.memberIds.length > 0;
```

---

## ✅ 불가능한 상태 방지

### ❌ 잘못된 State 설계
```typescript
// ❌ 피하기 - 불가능한 상태 조합이 가능
interface BadState {
  isLoading: boolean;
  hasError: boolean;
  data: GatheringItem[] | null;
  errorMessage: string | null;
}
// 문제: isLoading=true, hasError=true, data=[...] 동시 발생 가능
```

### ✅ 올바른 State 설계
```typescript
// ✅ Discriminated Union으로 명확하게
type GoodState =
  | { status: 'loading' }
  | { status: 'loaded'; data: GatheringItem[] }
  | { status: 'error'; message: string };
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **ViewModel 설계**: `viewmodel.md`
- **Screen 설계**: `screen.md`
