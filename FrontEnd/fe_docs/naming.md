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
// 컴포넌트/클래스 파일 → PascalCase
LoginScreen.tsx             // ✅ 올바름
PrimaryButton.tsx           // ✅ 올바름
LoginEntity.ts              // ✅ 올바름
ILoginRepository.ts         // ✅ 올바름

// 훅/유틸/DTO/Mapper 파일 → camelCase
useLoginViewModel.ts        // ✅ 올바름
loginDto.ts                 // ✅ 올바름
loginMapper.ts              // ✅ 올바름
dateUtils.ts                // ✅ 올바름
apiConstants.ts             // ✅ 올바름
```

### 클래스명 (PascalCase)
```typescript
class LoginRepositoryImpl {}     // ✅ 올바름
class loginRepositoryImpl {}     // ❌ 틀림
```

### 인터페이스명 (I + PascalCase)
```typescript
interface ILoginRepository {}    // ✅ 올바름
interface IGatheringDataSource {}// ✅ 올바름
interface LoginRepository {}     // ❌ I prefix 누락
```

### 변수명/함수명 (camelCase)
```typescript
const userName = '';                     // ✅ 올바름
const getUserData = () => {};            // ✅ 올바름
const fetchGatherings = async () => {};  // ✅ 올바름

const user_name = '';                    // ❌ 틀림
const GetUserData = () => {};            // ❌ 틀림 (함수는 camelCase)
```

### React 컴포넌트명 (PascalCase)
```typescript
const LoginScreen: React.FC = () => {};      // ✅ 올바름
const PrimaryButton: React.FC = () => {};    // ✅ 올바름
const loginScreen: React.FC = () => {};      // ❌ 틀림
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
type LoginState = { ... };           // ✅ 올바름
interface UserEntity { ... }         // ✅ 올바름
type CompanionListStatus = ...;      // ✅ 올바름
```

### Zustand Store 훅 (use + PascalCase + Store)
```typescript
const useGatheringStore = create<GatheringStore>(...);  // ✅
type GatheringStore = { ... };                          // ✅
```

---

## ✅ 레이어별 네이밍 규칙

### 1. Entity (Domain Layer)
```typescript
// 파일명: {Name}Entity.ts
// 타입명: {Name}Entity

// ✅ 예시
// 파일: UserEntity.ts
export interface UserEntity {
  id: number;
  email: string;
  nickname: string;
  profileImage?: string;
}

// 파일: GatheringEntity.ts
export interface GatheringEntity {
  id: number;
  title: string;
  gameDate: Date;
  homeTeam: string;
  awayTeam: string;
  maxParticipants: number;
  currentParticipants: number;
  isFull: boolean;        // 계산된 필드
}
```

**네이밍 팁:**
- 비즈니스 도메인 용어 사용
- 복수형보다 단수형 선호 (`User` not `Users`)
- 명확한 의미 전달 (`UserProfile` not `Data`)

---

### 2. DTO (Data Layer)
```typescript
// 파일명: {name}Dto.ts
// 타입명: {Name}Dto

// ✅ 예시
// 파일: loginDto.ts
export interface LoginDto {
  id: number;
  email: string;
  nickname: string;
  profile_image?: string;   // API의 snake_case 그대로
  access_token: string;
  refresh_token: string;
}
```

**네이밍 팁:**
- API 응답 필드명과 일치 (snake_case 허용)
- 반드시 `Dto` suffix 붙이기

---

### 3. Mapper
```typescript
// 파일명: {name}Mapper.ts
// 네임스페이스/객체명: {Name}Mapper
// 메서드명: toEntity, fromEntity, toEntityList

// ✅ 예시
// 파일: gatheringMapper.ts
export const GatheringMapper = {
  toEntity: (dto: GatheringDto): GatheringEntity => { ... },
  toEntityList: (dtos: GatheringDto[]): GatheringEntity[] => { ... },
  fromEntity: (entity: GatheringEntity): Partial<GatheringDto> => { ... },
};
```

**메서드 네이밍 규칙:**
| 메서드명 | 용도 |
|---------|------|
| `toEntity` | DTO → Entity |
| `fromEntity` | Entity → DTO |
| `toEntityList` | DTO[] → Entity[] |
| `fromEntityList` | Entity[] → DTO[] |

---

### 4. Repository
```typescript
// 인터페이스: I{Name}Repository.ts
// 구현: {Name}RepositoryImpl.ts

// ✅ 인터페이스
export interface IGatheringRepository {
  getGatherings(params: GetCompanionsParams): Promise<GatheringEntity[]>;
  getGatheringById(id: number): Promise<GatheringEntity>;
  createGathering(data: CreateCompanionData): Promise<GatheringEntity>;
  updateGathering(id: number, data: UpdateCompanionData): Promise<GatheringEntity>;
  deleteGathering(id: number): Promise<void>;
}
```

**메서드 네이밍 규칙:**
| 작업 | 메서드명 패턴 | 예시 |
|-----|-------------|------|
| 조회 (단건) | `get{Name}By{Param}` | `getMemberById`, `getGatheringById` |
| 조회 (목록) | `get{Names}` | `getGatherings`, `getUsers` |
| 생성 | `create{Name}` | `createGathering`, `createMember` |
| 수정 | `update{Name}` | `updateGathering`, `updateProfile` |
| 삭제 | `delete{Name}` | `deleteGathering`, `deleteMember` |
| 검색 | `search{Names}` | `searchGatherings`, `searchMembers` |

---

### 5. DataSource
```typescript
// 인터페이스: I{Name}DataSource.ts
// 구현: {Name}DataSourceImpl.ts
// Mock: Mock{Name}DataSource.ts

export interface IGatheringDataSource {
  fetchGatherings(params: FetchCompanionsParams): Promise<GatheringDto[]>;
  fetchCompanionById(id: number): Promise<GatheringDto>;
  postGathering(data: Record<string, unknown>): Promise<GatheringDto>;
  deleteGathering(id: number): Promise<void>;
}
```

**DataSource vs Repository 메서드명 차이:**
| 작업 | DataSource | Repository |
|-----|-----------|-----------|
| 조회 | `fetch{Name}` | `get{Name}` |
| 생성 | `post{Name}` | `create{Name}` |
| 수정 | `put{Name}` | `update{Name}` |
| 삭제 | `delete{Name}` | `delete{Name}` |

---

### 6. ViewModel Hook
```typescript
// 파일명: use{Name}ViewModel.ts
// 함수명: use{Name}ViewModel

// ✅ 예시
export const useGatheringListViewModel = () => {
  const state = useGatheringStore();
  // ...
  return {
    state,
    loadGatherings,
    refresh,
    loadMore,
  };
};
```

**내부 함수 네이밍 규칙:**
| 작업 | 함수명 패턴 | 예시 |
|-----|-----------|------|
| 로드 | `load{Name}` | `loadGatherings`, `loadProfile` |
| 새로고침 | `refresh` | `refresh` |
| 추가 로드 | `loadMore` | `loadMore` |
| 생성 | `create{Name}` | `createGathering` |
| 수정 | `update{Name}` | `updateProfile` |
| 삭제 | `delete{Name}` | `deleteGathering` |
| 제출 | `submit` | `submit` |
| 필드 업데이트 | `update{Field}` | `updateTitle`, `updateContent` |
| 검증 | `validate` | `validate` |
| 리셋 | `reset` | `reset` |

---

### 7. Screen
```typescript
// 파일명: {Name}Screen.tsx
// 컴포넌트명: {Name}Screen

// ✅ 예시
const GatheringListScreen: React.FC<GatheringListScreenProps> = ({ navigation }) => { ... };
```

- 반드시 `Screen` suffix 붙이기
- 예: `LoginScreen`, `GatheringListScreen`, `TicketScanScreen`

---

### 8. Component
```typescript
// 파일명: {Name}.tsx
// 컴포넌트명: {Name}

// ✅ 예시
const CompanionCard: React.FC<CompanionCardProps> = ({ companion, onPress }) => { ... };
const PrimaryButton: React.FC<PrimaryButtonProps> = ({ text, onPress }) => { ... };
```

- 일반적으로 `Component` suffix 생략
- 명확한 목적을 나타내는 이름 사용

---

## ✅ Props 타입 네이밍

```typescript
// 컴포넌트명 + Props
interface CompanionCardProps {
  companion: GatheringEntity;
  onPress?: () => void;
  isSelected?: boolean;
}

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}
```

---

## ✅ Boolean 변수 네이밍

```typescript
// ✅ 올바름
const isLoading = true;
const hasError = false;
const canEdit = true;
const shouldUpdate = false;

// ❌ 피하기
const loading = true;    // 의미 불명확
const error = false;     // 에러 객체와 혼동
```

**패턴:**
| Prefix | 의미 | 예시 |
|--------|-----|------|
| `is` | 상태 | `isLoading`, `isVisible`, `isEnabled` |
| `has` | 보유 | `hasData`, `hasError`, `hasPermission` |
| `can` | 가능 | `canEdit`, `canDelete`, `canSubmit` |
| `should` | 필요 | `shouldUpdate`, `shouldRefresh` |

---

## ✅ 이벤트 핸들러 네이밍

```typescript
// 컴포넌트 내부 핸들러 → handle + 이벤트명
const handlePress = () => {};
const handleChange = (text: string) => {};
const handleSubmit = async () => {};

// Props로 전달하는 콜백 → on + 이벤트명
interface ButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
}
```

---

## ✅ 금지 사항

### ❌ 축약어 사용 자제
```typescript
// ❌ 피하기
const usr = '';
let cnt = 0;
const msg = '';

// ✅ 명확하게
const user = '';
let count = 0;
const message = '';
```

### ❌ 의미 없는 이름 금지
```typescript
// ❌ 피하기
const data: any;
const temp: any;

// ✅ 의미 있는 이름
const userData: UserEntity;
const tempUserData: Partial<UserEntity>;
```

### ❌ any 타입 사용 금지
```typescript
// ❌ 피하기
const fetchData = async (): Promise<any> => { ... };
const handleResponse = (res: any) => { ... };

// ✅ 명확한 타입 사용
const fetchData = async (): Promise<GatheringEntity[]> => { ... };
const handleResponse = (res: GatheringDto) => { ... };
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **DTO 설계**: `dto.md`
- **Mapper 설계**: `mapper.md`
- **DataSource 설계**: `data_source.md`
- **State 관리**: `state.md`
- **ViewModel 설계**: `viewmodel.md`