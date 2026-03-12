# 🏷️ 네이밍 규칙 가이드

## ✅ 목적
일관된 네이밍 규칙을 통해 코드의 가독성을 높이고,
팀원 간 원활한 협업과 빠른 코드 이해를 가능하게 합니다.

---

## 🧱 기본 원칙
- **명확성**: 이름만 보고도 역할을 알 수 있어야 함
- **일관성**: 같은 종류는 같은 패턴 사용
- **간결성**: 불필요하게 길지 않게
- **영어 사용**: 한글 변수명 사용 금지

---

## ✅ 케이스별 규칙

### 파일명
```typescript
// 컴포넌트/화면 파일 → PascalCase
LoginScreen.tsx             // ✅ 올바름
PrimaryButton.tsx           // ✅ 올바름

// 훅/서비스/타입/유틸 파일 → camelCase
useLoginViewModel.ts        // ✅ 올바름
authService.ts              // ✅ 올바름
authTypes.ts                // ✅ 올바름
dateUtils.ts                // ✅ 올바름
apiConstants.ts             // ✅ 올바름
```

### 변수명/함수명 (camelCase)
```typescript
const userName = '';
const getUserData = () => {};
const fetchGatherings = async () => {};
```

### React 컴포넌트명 (PascalCase)
```typescript
const LoginScreen: React.FC = () => {};
const PrimaryButton: React.FC = () => {};
```

### 상수
```typescript
// 모듈 레벨 상수 → UPPER_SNAKE_CASE
export const MAX_RETRY_COUNT = 3;
export const API_TIMEOUT = 30000;

// 객체 형태 상수 → camelCase 키
export const apiConstants = {
  baseUrl: 'https://api.example.com',
  timeout: 30000,
};
```

### 타입/인터페이스 (PascalCase)
```typescript
type GatheringItem = { ... };
interface UserProfile { ... }
```

### Zustand Store 훅
```typescript
const useGatheringStore = create<GatheringStore>(...);
type GatheringStore = { ... };
```

---

## ✅ MVVM 레이어별 네이밍 규칙

### 1. Types (`{name}Types.ts`)
```typescript
// 파일: gatheringTypes.ts

// API 응답 타입 (snake_case 허용)
export interface GatheringResponse {
  id: number;
  title: string;
  host_id: number;
  member_count: number;
  created_at: string;
}

// 앱 내부에서 사용하는 타입 (camelCase)
export interface GatheringItem {
  id: number;
  title: string;
  hostId: number;
  memberCount: number;
  createdAt: Date;
}
```

**네이밍 팁:**
- API 응답 타입: `{Name}Response`
- 앱 내부 타입: `{Name}Item` 또는 `{Name}`
- 요청 파라미터 타입: `{Name}Params` 또는 `Create{Name}Request`

---

### 2. Service (`{name}Service.ts`)
```typescript
// 파일: gatheringService.ts

export const getGatherings = async (params: GetGatheringsParams): Promise<GatheringItem[]> => { ... };
export const getGatheringById = async (id: number): Promise<GatheringItem> => { ... };
export const createGathering = async (data: CreateGatheringRequest): Promise<GatheringItem> => { ... };
export const updateGathering = async (id: number, data: UpdateGatheringRequest): Promise<GatheringItem> => { ... };
export const deleteGathering = async (id: number): Promise<void> => { ... };
```

**함수 네이밍 규칙:**
| 작업 | 패턴 | 예시 |
|-----|------|------|
| 조회 (단건) | `get{Name}By{Param}` | `getGatheringById` |
| 조회 (목록) | `get{Names}` | `getGatherings` |
| 생성 | `create{Name}` | `createGathering` |
| 수정 | `update{Name}` | `updateGathering` |
| 삭제 | `delete{Name}` | `deleteGathering` |
| 업로드 | `upload{Name}` | `uploadReceipt` |

---

### 3. ViewModel Hook (`use{Name}ViewModel.ts`)
```typescript
// 파일: useGatheringListViewModel.ts
export const useGatheringListViewModel = () => {
  // ...
  return { state, loadGatherings, refresh, loadMore };
};
```

**내부 함수 네이밍:**
| 작업 | 패턴 | 예시 |
|-----|------|------|
| 로드 | `load{Name}` | `loadGatherings` |
| 새로고침 | `refresh` | `refresh` |
| 추가 로드 | `loadMore` | `loadMore` |
| 생성 | `create{Name}` | `createGathering` |
| 수정 | `update{Name}` | `updateProfile` |
| 삭제 | `delete{Name}` | `deleteGathering` |
| 제출 | `submit` | `submit` |
| 필드 업데이트 | `update{Field}` | `updateTitle` |
| 검증 | `validate` | `validate` |
| 리셋 | `reset` | `reset` |

---

### 4. Screen (`{Name}Screen.tsx`)
```typescript
const GatheringListScreen: React.FC<GatheringListScreenProps> = ({ navigation }) => { ... };
```
- 반드시 `Screen` suffix 붙이기

---

### 5. Component (`{Name}.tsx`)
```typescript
const GatheringCard: React.FC<GatheringCardProps> = ({ item, onPress }) => { ... };
```
- 일반적으로 `Component` suffix 생략

---

## ✅ Props 타입 네이밍

```typescript
interface GatheringCardProps {
  item: GatheringItem;
  onPress?: () => void;
  isSelected?: boolean;
}
```

---

## ✅ Boolean 변수 네이밍

| Prefix | 의미 | 예시 |
|--------|-----|------|
| `is` | 상태 | `isLoading`, `isVisible` |
| `has` | 보유 | `hasData`, `hasError` |
| `can` | 가능 | `canEdit`, `canDelete` |
| `should` | 필요 | `shouldUpdate`, `shouldRefresh` |

---

## ✅ 이벤트 핸들러 네이밍

```typescript
// 컴포넌트 내부 핸들러 → handle + 이벤트명
const handlePress = () => {};
const handleSubmit = async () => {};

// Props로 전달하는 콜백 → on + 이벤트명
interface ButtonProps {
  onPress: () => void;
}
```

---

## ✅ 금지 사항

```typescript
// ❌ 축약어 사용 자제
const usr = '';    // → const user = '';

// ❌ 의미 없는 이름 금지
const data: any;   // → const userData: UserProfile;

// ❌ any 타입 사용 금지
const fetchData = async (): Promise<any> => {};
// → const fetchData = async (): Promise<GatheringItem[]> => {};
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **타입/Service 설계**: `model.md`
- **ViewModel 설계**: `viewmodel.md`
