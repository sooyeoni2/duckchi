# 🔌 ViewModel (커스텀 훅) 설계 가이드

## ✅ 목적
ViewModel은 상태를 관리하고 비즈니스 로직을 실행하는 커스텀 훅으로,
View와 Model 사이를 연결하는 계층입니다.
Service를 호출하여 데이터를 가져오고 Zustand로 상태를 관리합니다.

---

## 🧱 설계 원칙
- **단일 책임**: 하나의 화면에 대한 상태만 관리
- **UI 로직 금지**: Navigation, Alert는 Screen에서 처리
- **Service 호출**: 데이터는 Service 함수를 통해서만 접근
- **불변 State**: 상태를 직접 수정하지 않고 새 상태 생성

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── viewmodels/
            └── use{Name}ViewModel.ts
```

---

## ✅ ViewModel 기본 구조

### 1. 데이터 로딩 ViewModel (목록 화면)
```typescript
// features/gathering/viewmodels/useGatheringListViewModel.ts
import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { getGatherings } from '../models/gatheringService';
import type { GatheringItem } from '../models/gatheringTypes';

type GatheringListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; items: GatheringItem[]; hasMore: boolean; currentPage: number; isLoadingMore: boolean }
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

const PAGE_SIZE = 20;

export const useGatheringListViewModel = () => {
  const { state, setState } = useGatheringListStore();

  const loadGatherings = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const items = await getGatherings({ page: 0, size: PAGE_SIZE });
      if (items.length === 0) {
        setState({ status: 'empty' });
      } else {
        setState({ status: 'loaded', items, hasMore: items.length >= PAGE_SIZE, currentPage: 0, isLoadingMore: false });
      }
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : '오류가 발생했습니다' });
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
      const newItems = await getGatherings({ page: nextPage, size: PAGE_SIZE });
      setState({
        ...state,
        items: [...state.items, ...newItems],
        currentPage: nextPage,
        hasMore: newItems.length >= PAGE_SIZE,
        isLoadingMore: false,
      });
    } catch {
      setState({ ...state, isLoadingMore: false });
    }
  }, [state, setState]);

  useEffect(() => {
    loadGatherings();
  }, [loadGatherings]);

  return { state, refresh, loadMore };
};
```

### 2. 폼 ViewModel (생성/수정 화면)
```typescript
// features/gathering/viewmodels/useGatheringCreateViewModel.ts
import { useCallback } from 'react';
import { create } from 'zustand';
import { createGathering } from '../models/gatheringService';

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
    updateState({ errorMessage: null });
    return true;
  }, [state, updateState]);

  // boolean 반환 → Screen에서 navigation 처리
  const submit = useCallback(async (): Promise<boolean> => {
    if (!validate()) return false;

    updateState({ isSubmitting: true, errorMessage: null });
    try {
      await createGathering({
        title: state.title,
        category: state.category,
        memberIds: state.memberIds,
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

## ✅ 반환값 패턴

```typescript
// boolean 반환 → Screen에서 navigation 처리
const submit = async (): Promise<boolean> => { ... };

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
```typescript
// ❌ ViewModel에서 UI 로직
const submit = async () => {
  navigation.navigate('GatheringList'); // ❌
  Alert.alert('생성 완료!');           // ❌
};

// ❌ 상태 직접 수정
state.title = title; // ❌

// ❌ 렌더링 로직을 ViewModel에 작성
const getStatusColor = () => state.status === 'loaded' ? 'green' : 'red'; // ❌
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **타입/Service 설계**: `model.md`
- **State 설계**: `state.md`
- **Screen 설계**: `screen.md`
