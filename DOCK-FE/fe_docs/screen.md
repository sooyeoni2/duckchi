# 📱 Screen 설계 가이드

## ✅ 목적
Screen은 하나의 독립적인 화면 단위로,
ViewModel에서 State를 읽어와 UI를 렌더링하고 사용자 입력을 처리합니다.

---

## 🧱 설계 원칙
- **단일 책임**: 하나의 화면만 담당
- **UI만 담당**: 비즈니스 로직은 ViewModel에 위임
- **선언적 UI**: State에 따라 UI를 선언적으로 렌더링
- **Navigation/Alert**: Screen에서 처리

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── views/
            ├── {Name}Screen.tsx
            └── components/
                └── {ComponentName}.tsx
```

---

## ✅ Screen 기본 구조

### 1. 목록 화면
```typescript
// features/gathering/views/GatheringListScreen.tsx
import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGatheringListViewModel } from '../viewmodels/useGatheringListViewModel';
import { GatheringCard } from './components/GatheringCard';
import { LoadingIndicator } from '@shared/components/loading/LoadingIndicator';
import { ErrorView } from '@shared/components/feedback/ErrorView';
import { EmptyView } from '@shared/components/feedback/EmptyView';
import { AppColorStyles } from '@core/theme/colors';
import type { AppStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'GatheringList'>;

const GatheringListScreen: React.FC<Props> = ({ navigation }) => {
  const { state, refresh, loadMore } = useGatheringListViewModel();

  const handleCardPress = useCallback(
    (gatheringId: number) => navigation.navigate('GatheringDetail', { gatheringId }),
    [navigation],
  );

  if (state.status === 'loading') return <LoadingIndicator />;
  if (state.status === 'error') return <ErrorView message={state.message} onRetry={refresh} />;
  if (state.status === 'empty') return <EmptyView message="모임방이 없습니다" />;
  if (state.status !== 'loaded') return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={state.items}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <GatheringCard item={item} onPress={() => handleCardPress(item.id)} />
        )}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={state.isLoadingMore ? <ActivityIndicator /> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColorStyles.background },
});

export default GatheringListScreen;
```

### 2. 폼 화면
```typescript
// features/gathering/views/GatheringCreateScreen.tsx
import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGatheringCreateViewModel } from '../viewmodels/useGatheringCreateViewModel';
import { PrimaryButton } from '@shared/components/buttons/PrimaryButton';
import { CustomTextInput } from '@shared/components/inputs/CustomTextInput';
import type { AppStackParamList } from '@core/navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'GatheringCreate'>;

const GatheringCreateScreen: React.FC<Props> = ({ navigation }) => {
  const { state, updateTitle, updateCategory, submit, reset } = useGatheringCreateViewModel();

  // Navigation, Alert 처리는 Screen에서
  const handleSubmit = async () => {
    const success = await submit();
    if (success) {
      Alert.alert('모임방이 생성되었습니다.');
      navigation.goBack();
      reset();
    }
  };

  return (
    <View style={styles.container}>
      <CustomTextInput
        value={state.title}
        onChangeText={updateTitle}
        placeholder="모임 이름"
        errorMessage={state.errorMessage}
      />
      <PrimaryButton
        text="만들기"
        onPress={handleSubmit}
        isLoading={state.isSubmitting}
        disabled={state.isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});

export default GatheringCreateScreen;
```

---

## ✅ Screen 책임 분리 원칙

| 항목 | Screen | ViewModel |
|------|--------|-----------|
| 데이터 로딩 | ❌ | ✅ |
| 상태 관리 | ❌ | ✅ |
| API 호출 | ❌ | ✅ (Service를 통해) |
| UI 렌더링 | ✅ | ❌ |
| Navigation | ✅ | ❌ |
| Alert/Toast | ✅ | ❌ |
| 입력 이벤트 | ✅ (ViewModel에 위임) | ❌ |

---

## ✅ State별 렌더링 패턴

```typescript
// Discriminated Union 활용
if (state.status === 'loading') return <LoadingIndicator />;
if (state.status === 'error') return <ErrorView message={state.message} onRetry={refresh} />;
if (state.status === 'empty') return <EmptyView message="데이터가 없습니다" />;
if (state.status !== 'loaded') return null;

// loaded 상태에서 정상 렌더링
return <MainContent items={state.items} />;
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **ViewModel 설계**: `viewmodel.md`
- **Component 설계**: `component.md`
- **State 설계**: `state.md`
