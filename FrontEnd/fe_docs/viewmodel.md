# 🔌 ViewModel (커스텀 훅) 설계 가이드

## ✅ 목적
ViewModel은 State를 관리하고 비즈니스 로직을 실행하는 커스텀 훅으로,
UI와 Domain 레이어를 연결하는 중간 계층입니다.
Zustand Store를 기반으로 상태를 관리하며, Repository/UseCase를 호출합니다.

---

## 🧱 설계 원칙
- **단일 책임**: 하나의 화면/기능에 대한 상태만 관리
- **불변 State**: State는 직접 수정하지 않고 새로운 State 생성
- **부수 효과 최소화**: State 변경만 담당, UI 로직(Navigation, Alert)은 Screen에서
- **재사용 가능**: 여러 Screen에서 같은 ViewModel 훅 사용 가능

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── presentation/
            └── {screen_name}/
                ├── use{Name}ViewModel.ts    # ViewModel 훅 ✨
                └── {Name}Screen.tsx         # Screen
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ ViewModel 기본 구조

### 1. 비동기 데이터 로딩 ViewModel
```typescript
// features/gathering/presentation/gathering_list/useGatheringListViewModel.ts
import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { GatheringEntity } from '../../domain/gathering_list/GatheringEntity';
import { GatheringRepositoryImpl } from '../../data/gathering_list/GatheringRepositoryImpl';
import { GatheringDataSourceImpl } from '../../data/gathering_list/dataSource/GatheringDataSourceImpl';

type GatheringListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; gatherings: GatheringEntity[]; hasMore: boolean; currentPage: number; isLoadingMore: boolean }
  | { status: 'error'; message: string }
  | { status: 'empty' };

interface GatheringListStore {
  state: GatheringListState;
  setState: (state: GatheringListState) => void;
}

const useGatheringListStore = create<GatheringListStore>(set => ({
  state: { status: 'idle' },
  setState: state => set({ state }),
}));

const dataSource = new GatheringDataSourceImpl();
const repository = new GatheringRepositoryImpl(dataSource);

const PAGE_SIZE = 20;

export const useGatheringListViewModel = () => {
  const { state, setState } = useGatheringListStore();

  const loadGatherings = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const gatherings = await repository.getGatherings({ page: 0, size: PAGE_SIZE });
      if (gatherings.length === 0) {
        setState({ status: 'empty' });
      } else {
        setState({
          status: 'loaded',
          gatherings,
          hasMore: gatherings.length >= PAGE_SIZE,
          currentPage: 0,
          isLoadingMore: false,
        });
      }
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    }
  }, [setState]);

  const refresh = useCallback(async () => {
    await loadGatherings();
  }, [loadGatherings]);

  const loadMore = useCallback(async () => {
    if (state.status !== 'loaded' || !state.hasMore || state.isLoadingMore) return;

    setState({ ...state, isLoadingMore: true });

    try {
      const nextPage = state.currentPage + 1;
      const newGatherings = await repository.getGatherings({
        page: nextPage,
        size: PAGE_SIZE,
      });

      setState({
        ...state,
        gatherings: [...state.gatherings, ...newGatherings],
        currentPage: nextPage,
        hasMore: newGatherings.length >= PAGE_SIZE,
        isLoadingMore: false,
      });
    } catch {
      setState({ ...state, isLoadingMore: false });
    }
  }, [state, setState]);

  useEffect(() => {
    loadGatherings();
  }, [loadGatherings]);

  return { state, loadGatherings, refresh, loadMore };
};
```

### 2. 폼 ViewModel (모임방 생성)
```typescript
// features/gathering/presentation/gathering_create/useGatheringCreateViewModel.ts
import { useCallback } from 'react';
import { create } from 'zustand';

interface GatheringCreateState {
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

interface GatheringCreateStore {
  state: GatheringCreateState;
  updateState: (partial: Partial<GatheringCreateState>) => void;
  reset: () => void;
}

const useGatheringCreateStore = create<GatheringCreateStore>(set => ({
  state: initialState,
  updateState: partial => set(store => ({ state: { ...store.state, ...partial } })),
  reset: () => set({ state: initialState }),
}));

const dataSource = new GatheringDataSourceImpl();
const repository = new GatheringRepositoryImpl(dataSource);

export const useGatheringCreateViewModel = () => {
  const { state, updateState, reset } = useGatheringCreateStore();

  const updateTitle = useCallback((title: string) => updateState({ title }), [updateState]);
  const updateCategory = useCallback((category: string) => updateState({ category }), [updateState]);
  const updateMembers = useCallback((memberIds: number[]) => updateState({ memberIds }), [updateState]);

  const validate = useCallback((): boolean => {
    if (!state.title.trim()) {
      updateState({ errorMessage: '모임 이름을 입력해 주세요.' });
      return false;
    }
    if (state.title.length > 20) {
      updateState({ errorMessage: '모임 이름은 20자 이하로 입력해 주세요.' });
      return false;
    }
    if (state.memberIds.length === 0) {
      updateState({ errorMessage: '참여자를 1명 이상 추가해 주세요.' });
      return false;
    }
    return true;
  }, [state, updateState]);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!validate()) return false;

    updateState({ isSubmitting: true, errorMessage: null });

    try {
      await repository.createGathering({
        title: state.title,
        category: state.category,
        memberIds: state.memberIds,
        defaultLimit: state.defaultLimit,
      });

      updateState({ isSubmitting: false });
      return true;
    } catch (error) {
      updateState({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '생성 중 오류가 발생했습니다',
      });
      return false;
    }
  }, [state, validate, updateState]);

  return { state, updateTitle, updateCategory, updateMembers, submit, reset };
};
```

---

## ✅ 실전 예시

### 1. N빵 뽑기 ViewModel
```typescript
// features/nbang/presentation/nbang_draw/useNbangDrawViewModel.ts
import { NbangDrawResultEntity } from '../../domain/nbang_draw/NbangDrawEntity';

type NbangDrawState =
  | { status: 'idle' }
  | { status: 'setting'; drawCount: number; paymentIds: number[] }
  | { status: 'drawing' }
  | { status: 'result'; result: NbangDrawResultEntity }
  | { status: 'error'; message: string };

export const useNbangDrawViewModel = (gatheringId: number) => {
  const { state, setState } = useNbangDrawStore();

  const updateDrawCount = useCallback((drawCount: number) => {
    if (state.status !== 'setting') return;
    setState({ ...state, drawCount });
  }, [state, setState]);

  // 시작 누르면 API 호출 → 결과 받아서 연출용 상태로 전환
  const startDraw = useCallback(async (): Promise<boolean> => {
    if (state.status !== 'setting') return false;

    setState({ status: 'drawing' });

    try {
      const result = await repository.drawNbang({
        gatheringId,
        drawCount: state.drawCount,
        paymentIds: state.paymentIds,
      });

      setState({ status: 'result', result });
      return true;
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : '오류 발생' });
      return false;
    }
  }, [state, setState, gatheringId]);

  const reset = useCallback(() => {
    setState({ status: 'setting', drawCount: 1, paymentIds: [] });
  }, [setState]);

  return { state, updateDrawCount, startDraw, reset };
};
```

### 2. OCR 영수증 스캔 ViewModel
```typescript
// features/payment/presentation/receipt_scan/useReceiptScanViewModel.ts
import { ReceiptScanEntity } from '../../domain/receipt_scan/ReceiptScanEntity';

type ReceiptScanState =
  | { status: 'idle' }
  | { status: 'capturing' }
  | { status: 'processing' }
  | { status: 'result'; receipt: ReceiptScanEntity }
  | { status: 'error'; message: string; canRetry: boolean };

export const useReceiptScanViewModel = () => {
  const { state, setState } = useReceiptScanStore();

  const processImage = useCallback(async (imageUri: string): Promise<void> => {
    setState({ status: 'processing' });

    try {
      const formData = new FormData();
      formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'receipt.jpg' } as any);

      const receipt = await repository.scanReceipt(formData);
      setState({ status: 'result', receipt });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'OCR 처리 중 오류가 발생했습니다',
        canRetry: true,
      });
    }
  }, [setState]);

  const reset = useCallback(() => {
    setState({ status: 'capturing' });
  }, [setState]);

  return { state, processImage, reset };
};
```

### 3. 낙관적 업데이트 ViewModel (방장 위임)
```typescript
// features/gathering/presentation/gathering_detail/useGatheringDetailViewModel.ts
export const useGatheringDetailViewModel = (gatheringId: number) => {
  const { state, setState } = useGatheringDetailStore();

  const delegateHost = useCallback(async (newHostId: number): Promise<boolean> => {
    if (state.status !== 'loaded') return false;
    const previousState = state;

    // 낙관적 업데이트
    setState({ ...state, isDelegating: true });

    try {
      await delegateHostUseCase.execute(gatheringId, newHostId);
      setState({ ...state, isHost: false, isDelegating: false });
      return true;
    } catch (error) {
      // 실패 시 롤백
      setState({ ...previousState, isDelegating: false });
      return false;
    }
  }, [state, setState, gatheringId]);

  return { state, delegateHost };
};
```

---

## ✅ 메서드 네이밍 규칙

| 작업 | 메서드명 패턴 | 예시 |
|-----|-----------|------|
| 로드 | `load{Name}` | `loadGatherings()`, `loadPayments()` |
| 새로고침 | `refresh` | `refresh()` |
| 다음 페이지 | `loadMore` | `loadMore()` |
| 생성 | `create{Name}` | `createGathering()` |
| 수정 | `update{Name}` | `updateGathering()` |
| 삭제 | `delete{Name}` | `deleteGathering()` |
| 제출 | `submit` | `submit()` |
| 필드 업데이트 | `update{Field}` | `updateTitle()`, `updateCategory()` |
| 검증 | `validate` | `validate()` |
| 리셋 | `reset` | `reset()` |

---

## ✅ 반환값 패턴

```typescript
// ✅ boolean 반환 - Screen에서 Navigation 처리
const submit = async (): Promise<boolean> => {
  try {
    await repository.createGathering(data);
    return true;
  } catch {
    updateState({ errorMessage: '오류 발생' });
    return false;
  }
};

// Screen에서
const handleSubmit = async () => {
  const success = await submit();
  if (success) {
    navigation.goBack();
    Alert.alert('모임방이 생성되었습니다.');
  }
};
```

---

## ✅ 주의사항

### ❌ 하지 말아야 할 것

1. **ViewModel에서 UI 로직**
```typescript
// ❌ 피하기
const submit = async () => {
  navigation.navigate('GatheringList'); // ❌ ViewModel에서 Navigation 금지
  Alert.alert('생성 완료!');           // ❌ Alert 금지
};

// ✅ Screen에서 처리
const handleSubmit = async () => {
  const success = await viewModel.submit();
  if (success) {
    navigation.navigate('GatheringList');
    Alert.alert('생성 완료!');
  }
};
```

2. **State 직접 수정**
```typescript
// ❌ 피하기
const updateTitle = (title: string) => {
  state.title = title; // ❌
};

// ✅ 새로운 상태 생성
const updateTitle = (title: string) => {
  updateState({ title });
};
```

3. **ViewModel에서 렌더링 로직**
```typescript
// ❌ 피하기
const getStatusColor = () => {
  return state.status === 'loaded' ? 'green' : 'red'; // ❌ UI 로직
};

// ✅ Screen/Component에서 처리
const statusColor = state.status === 'loaded' ? 'green' : 'red';
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **State 설계**: `state.md`
- **Screen 설계**: `screen.md`
- **UseCase 설계**: `usecase.md`