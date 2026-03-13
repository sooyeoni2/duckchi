# 📱 Screen 설계 가이드

## ✅ 목적
Screen은 하나의 독립적인 화면 단위로,
ViewModel 훅에서 State를 읽어와 UI를 렌더링하고 사용자 입력을 처리합니다.

---

## 🧱 설계 원칙
- **단일 책임**: 하나의 화면만 담당
- **UI만 담당**: 비즈니스 로직은 ViewModel에 위임
- **선언적 UI**: State에 따라 UI를 선언적으로 렌더링
- **재사용 가능한 Component 분리**: 공통 부분은 Component로 추출

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── presentation/
            └── {screen_name}/
                ├── {Name}Screen.tsx         # Screen ✨
                ├── use{Name}ViewModel.ts    # ViewModel 훅
                └── components/              # 화면별 Component
                    ├── {ComponentName}.tsx
                    └── ...
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ Screen 기본 구조

### 1. 목록 화면 (모임방 목록)
```typescript
// features/gathering/presentation/gathering_list/GatheringListScreen.tsx
import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGatheringListViewModel } from './useGatheringListViewModel';
import { GatheringCard } from './components/GatheringCard';
import { LoadingIndicator } from '@shared/components/loading/LoadingIndicator';
import { ErrorView } from '@shared/components/feedback/ErrorView';
import { EmptyView } from '@shared/components/feedback/EmptyView';
import type { AppStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'GatheringList'>;

const GatheringListScreen: React.FC<Props> = ({ navigation }) => {
  const { state, loadGatherings, refresh, loadMore } = useGatheringListViewModel();

  const handleCardPress = useCallback(
    (gatheringId: number) => {
      navigation.navigate('GatheringDetail', { gatheringId });
    },
    [navigation],
  );

  const handleCreatePress = useCallback(() => {
    navigation.navigate('GatheringCreate');
  }, [navigation]);

  if (state.status === 'loading') return <LoadingIndicator />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={loadGatherings} />;
  if (state.status === 'empty') {
    return (
      <EmptyView
        title="모임방이 없어요"
        message="첫 번째 모임방을 만들어보세요"
        actionText="모임방 만들기"
        onActionPress={handleCreatePress}
      />
    );
  }

  if (state.status === 'loaded') {
    return (
      <FlatList
        data={state.gatherings}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <GatheringCard
            gathering={item}
            onPress={() => handleCardPress(item.id)}
          />
        )}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={state.isLoadingMore ? <ActivityIndicator /> : null}
      />
    );
  }

  return null;
};

export default GatheringListScreen;
```

### 2. OCR 영수증 스캔 화면
```typescript
// features/payment/presentation/receipt_scan/ReceiptScanScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useReceiptScanViewModel } from './useReceiptScanViewModel';
import { CameraView } from './components/CameraView';
import { ReceiptResultView } from './components/ReceiptResultView';
import { ReceiptOcrFailView } from './components/ReceiptOcrFailView';
import type { AppStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ReceiptScan'>;

const ReceiptScanScreen: React.FC<Props> = ({ navigation }) => {
  const { state, processImage, reset } = useReceiptScanViewModel();

  const handleCapture = useCallback(async (imageUri: string) => {
    await processImage(imageUri);
  }, [processImage]);

  const handleConfirm = useCallback(() => {
    if (state.status !== 'result') return;
    navigation.navigate('MemberAssign', { receipt: state.receipt });
  }, [state, navigation]);

  const handleRetake = useCallback(() => {
    reset();
  }, [reset]);

  if (state.status === 'processing') {
    return <LoadingIndicator message="영수증 인식 중..." />;
  }

  if (state.status === 'result') {
    return (
      <ReceiptResultView
        receipt={state.receipt}
        onConfirm={handleConfirm}
        onRetake={handleRetake}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <ReceiptOcrFailView
        message={state.message}
        onRetry={state.canRetry ? reset : undefined}
        onManualInput={() => navigation.navigate('ManualPaymentInput')}
      />
    );
  }

  return <CameraView onCapture={handleCapture} />;
};

export default ReceiptScanScreen;
```

### 3. 폼 화면 (모임방 생성)
```typescript
// features/gathering/presentation/gathering_create/GatheringCreateScreen.tsx
import React, { useCallback } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useGatheringCreateViewModel } from './useGatheringCreateViewModel';

const GatheringCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { state, updateTitle, updateCategory, updateMembers, submit } =
    useGatheringCreateViewModel();

  const handleSubmit = useCallback(async () => {
    const success = await submit();
    if (success) {
      navigation.goBack();
    }
  }, [submit, navigation]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={styles.content}>
        {state.errorMessage && <ErrorBanner message={state.errorMessage} />}

        <CustomTextInput
          label="모임 이름"
          value={state.title}
          onChangeText={updateTitle}
          placeholder="모임 이름을 입력해 주세요. (최대 20자)"
          maxLength={20}
        />

        <CategorySelector
          value={state.category}
          onChange={updateCategory}
        />

        <MemberSelector
          selectedIds={state.memberIds}
          onChange={updateMembers}
        />

        <PrimaryButton
          text={state.isSubmitting ? '생성 중...' : '모임방 만들기'}
          onPress={handleSubmit}
          disabled={state.isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
```

---

## ✅ Navigation 패턴

### 1. Stack Navigation
```typescript
navigation.navigate('GatheringDetail', { gatheringId: 1 });
navigation.navigate('MemberAssign', { receipt: receiptEntity });
navigation.goBack();
navigation.reset({ index: 0, routes: [{ name: 'GatheringList' }] });
```

### 2. Tab Navigation
```typescript
navigation.navigate('ProfileTab');
navigation.navigate('PaymentTab', {
  screen: 'ReceiptScan',
  params: { gatheringId: 1 },
});
```

---

## ✅ Alert / Toast 패턴

```typescript
// 방장 위임 확인 Dialog
const handleDelegateHost = useCallback((newHostId: number) => {
  Alert.alert(
    '방장 위임',
    '방장을 위임하면 되돌릴 수 없어요. 위임할까요?',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '위임하기',
        style: 'destructive',
        onPress: async () => {
          const success = await delegateHost(newHostId);
          if (success) navigation.goBack();
        },
      },
    ],
  );
}, [delegateHost, navigation]);

// 장바구니 담기 완료 토스트
Toast.show({
  type: 'success',
  text1: '장바구니에 담겼어요',
  text2: '정산 탭에서 확인하세요.',
});
```

---

## ✅ 주의사항

### ❌ 하지 말아야 할 것

1. **Screen에서 비즈니스 로직**
```typescript
// ❌ 피하기
const GatheringListScreen = () => {
  const { state } = useGatheringListViewModel();
  // ❌ Screen에서 필터링 금지
  const activeGatherings = state.status === 'loaded'
    ? state.gatherings.filter(g => g.isActive)
    : [];
};

// ✅ ViewModel 또는 Entity에서 처리
```

2. **렌더링 중 비동기 작업**
```typescript
// ❌ 피하기
const MyScreen = () => {
  const data = await fetchData(); // ❌
  return <Text>{data}</Text>;
};

// ✅ ViewModel에서 처리
const MyScreen = () => {
  const { state } = useMyViewModel();
  if (state.status === 'loaded') return <Text>{state.data}</Text>;
  return <LoadingIndicator />;
};
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **State 설계**: `state.md`
- **ViewModel 설계**: `viewmodel.md`
- **Component 설계**: `component.md`