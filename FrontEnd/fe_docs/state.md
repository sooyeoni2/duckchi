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

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── presentation/
            └── {screen_name}/
                ├── use{Name}ViewModel.ts    # State + 로직 포함
                └── {Name}Screen.tsx
```

State 타입은 ViewModel 훅 파일 내에 정의하거나, 별도 타입 파일로 분리합니다.

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ State 패턴 종류

### 1. Discriminated Union State (비동기 작업)
**사용 시기:** API 호출, 데이터 로딩이 있는 경우

```typescript
// features/gathering/presentation/gathering_list/useGatheringListViewModel.ts
import { GatheringEntity } from '../../domain/gathering_list/GatheringEntity';

export type GatheringListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; gatherings: GatheringEntity[]; hasMore: boolean; currentPage: number; isLoadingMore: boolean }
  | { status: 'error'; message: string }
  | { status: 'empty' };
```

### 2. Data State (복잡한 폼)
**사용 시기:** 여러 필드를 관리할 때

```typescript
// features/gathering/presentation/gathering_create/useGatheringCreateViewModel.ts
export interface GatheringCreateState {
  title: string;
  category: string;
  memberIds: number[];
  defaultLimit: number;
  isSubmitting: boolean;
  errorMessage: string | null;
}

const initialState: GatheringCreateState = {
  title: '',
  category: '기타',
  memberIds: [],
  defaultLimit: 30000,
  isSubmitting: false,
  errorMessage: null,
};
```

### 3. Hybrid State (Union + 부가 데이터)
**사용 시기:** 로딩 상태 + 복잡한 데이터 관리

```typescript
// features/payment/presentation/receipt_scan/useReceiptScanViewModel.ts
import { ReceiptScanEntity } from '../../domain/receipt_scan/ReceiptScanEntity';

export type ReceiptScanState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'processing' }
  | { status: 'result'; receipt: ReceiptScanEntity }
  | { status: 'error'; message: string; canRetry: boolean };
```

---

## ✅ Zustand Store 설계

```typescript
// features/gathering/presentation/gathering_list/useGatheringListViewModel.ts
import { create } from 'zustand';

interface GatheringListStore {
  state: GatheringListState;
  setState: (state: GatheringListState) => void;
  reset: () => void;
}

const useGatheringListStore = create<GatheringListStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
  reset: () => set({ state: { status: 'idle' } }),
}));
```

### 상태별 타입 가드 활용
```typescript
const { state } = useGatheringListViewModel();

if (state.status === 'loading') {
  return <LoadingIndicator />;
}
if (state.status === 'error') {
  return <ErrorView message={state.message} />;  // state.message 타입 안전
}
if (state.status === 'loaded') {
  return <GatheringList gatherings={state.gatherings} />;  // state.gatherings 타입 안전
}
```

---

## ✅ Status 값 네이밍 규칙

| 상태 | status 값 | 설명 |
|-----|-----------|-----|
| 초기 | `'idle'` | 화면 진입 직후 |
| 로딩 | `'loading'` | 데이터 로딩 중 |
| 성공 | `'loaded'` | 데이터 로드 완료 |
| 에러 | `'error'` | 에러 발생 |
| 빈 값 | `'empty'` | 데이터 없음 |
| 처리 중 | `'processing'` | OCR 처리, 업로드 등 |
| 완료 | `'completed'` | 작업 완료 |
| 제출 중 | `'submitting'` | 서버 전송 중 |
| 결과 | `'result'` | 뽑기 결과 등 |
| 촬영 중 | `'capturing'` | 카메라 촬영 |

📎 네이밍 규칙 상세는 `naming.md` 참고

---

## ✅ 실전 예시

### 1. 모임방 목록 State (페이지네이션)
```typescript
export type GatheringListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'loaded';
      gatherings: GatheringEntity[];
      hasMore: boolean;
      currentPage: number;
      isLoadingMore: boolean;
    }
  | { status: 'error'; message: string }
  | { status: 'empty' };
```

### 2. 모임방 상세 State (복합 상태)
```typescript
export type GatheringDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'loaded';
      gathering: GatheringEntity;
      isHost: boolean;
      isDelegating: boolean;    // 방장 위임 중
      isEditing: boolean;       // 모임방 수정 중
    }
  | { status: 'error'; message: string };
```

### 3. N빵 뽑기 State
```typescript
import { NbangDrawResultEntity } from '../../domain/nbang_draw/NbangDrawEntity';

export type NbangDrawState =
  | { status: 'idle' }
  | { status: 'setting'; drawCount: number; paymentIds: number[] }
  | { status: 'drawing' }                          // API 호출 중 + 연출 중
  | { status: 'result'; result: NbangDrawResultEntity }
  | { status: 'error'; message: string };
```

### 4. OCR 영수증 스캔 State
```typescript
export type ReceiptScanState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'processing' }
  | {
      status: 'result';
      receipt: ReceiptScanEntity;
      isEditing: boolean;     // 품목 편집 모드
    }
  | { status: 'error'; message: string; canRetry: boolean };
```

### 5. 폼 State (모임방 생성/수정)
```typescript
export interface GatheringFormState {
  // 입력값
  title: string;
  category: string;
  memberIds: number[];
  defaultLimit: number;

  // 검증 에러
  titleError: string | null;
  memberError: string | null;

  // UI 상태
  isSubmitting: boolean;
  errorMessage: string | null;
}

export const isGatheringFormValid = (state: GatheringFormState): boolean =>
  state.titleError === null &&
  state.memberError === null &&
  state.title.trim() !== '' &&
  state.memberIds.length > 0;
```

---

## ✅ 상태 업데이트 패턴

### loaded 상태 내부 업데이트
```typescript
// 페이지네이션 추가 로딩
const setLoadingMore = () =>
  set(store => {
    if (store.state.status !== 'loaded') return store;
    return { state: { ...store.state, isLoadingMore: true } };
  });

// 데이터 추가
const appendGatherings = (newGatherings: GatheringEntity[]) =>
  set(store => {
    if (store.state.status !== 'loaded') return store;
    return {
      state: {
        ...store.state,
        gatherings: [...store.state.gatherings, ...newGatherings],
        currentPage: store.state.currentPage + 1,
        hasMore: newGatherings.length >= PAGE_SIZE,
        isLoadingMore: false,
      },
    };
  });
```

---

## ✅ 불가능한 상태 방지

### ❌ 잘못된 State 설계
```typescript
// ❌ 피하기 - 불가능한 상태 조합이 가능
interface BadState {
  isLoading: boolean;
  hasError: boolean;
  data: GatheringEntity[] | null;
  errorMessage: string | null;
}
// 문제: isLoading=true, hasError=true, data=[...] 동시 발생 가능
```

### ✅ 올바른 State 설계
```typescript
// ✅ Discriminated Union으로 명확하게
type GoodState =
  | { status: 'loading' }
  | { status: 'loaded'; data: GatheringEntity[] }
  | { status: 'error'; message: string };
```

---

## ✅ State 설계 체크리스트

- [ ] 모든 가능한 상태를 명시적으로 정의했는가?
- [ ] 불가능한 상태를 표현할 수 없는가? (Discriminated Union 활용)
- [ ] UI에 필요한 최소한의 데이터만 포함했는가?
- [ ] 계산 가능한 값은 헬퍼 함수로 처리했는가?
- [ ] `null` 대신 Optional을 명시적으로 처리했는가?

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **ViewModel 설계**: `viewmodel.md`
- **Screen 설계**: `screen.md`
- **Component 설계**: `component.md`