# 🔄 Mapper 설계 가이드

## ✅ 목적
Mapper는 DTO와 Entity 간의 데이터 변환을 전담하는 레이어로,
복잡한 변환 로직, 날짜 처리, null 처리, 필드명 변환 등을 캡슐화합니다.

---

## 🧱 설계 원칙
- **단일 책임**: DTO ↔ Entity 변환만 담당
- **독립성**: DTO와 Entity 모두를 알지만, 둘은 Mapper를 모름
- **순수 함수**: 사이드 이펙트 없음, 동일 입력 → 동일 출력
- **에러 처리**: 변환 실패 시 명확한 예외 발생

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── data/
            └── {sub_feature}/
                ├── {name}Dto.ts
                ├── {name}Mapper.ts     # ✨ 여기!
                └── {Name}RepositoryImpl.ts
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ 기본 Mapper 구조

### 1. 객체(const) 스타일 Mapper
```typescript
// features/auth/data/login/loginMapper.ts
import { LoginDto } from './loginDto';
import { LoginEntity } from '../../domain/login/LoginEntity';

export const LoginMapper = {
  toEntity: (dto: LoginDto): LoginEntity => ({
    id: dto.id,
    email: dto.email,
    nickname: dto.nickname,
    profileImage: dto.profile_image ?? undefined,
    accessToken: dto.access_token,
    refreshToken: dto.refresh_token,
  }),

  toEntityList: (dtos: LoginDto[]): LoginEntity[] =>
    dtos.map(LoginMapper.toEntity),

  fromEntity: (entity: LoginEntity): LoginDto => ({
    id: entity.id,
    email: entity.email,
    nickname: entity.nickname,
    profile_image: entity.profileImage,
    access_token: entity.accessToken,
    refresh_token: entity.refreshToken,
  }),
};
```

### 2. 복잡한 변환이 있는 Mapper
```typescript
// features/gathering/data/gathering_list/gatheringMapper.ts
import { GatheringDto, MemberDto } from './gatheringDto';
import { GatheringEntity, MemberEntity } from '../../domain/gathering_list/GatheringEntity';

const toMemberEntity = (dto: MemberDto): MemberEntity => ({
  id: dto.id,
  nickname: dto.nickname,
  profileImage: dto.profile_image ?? undefined,
});

export const GatheringMapper = {
  toEntity: (dto: GatheringDto, currentUserId: number): GatheringEntity => ({
    id: dto.id,
    title: dto.title,
    category: dto.category,
    hostId: dto.host_id,
    members: dto.members.map(toMemberEntity),
    memberCount: dto.member_count,
    // 계산된 필드
    isHost: dto.host_id === currentUserId,
    isActive: dto.is_active,
    createdAt: new Date(dto.created_at),
  }),

  toEntityList: (dtos: GatheringDto[], currentUserId: number): GatheringEntity[] =>
    dtos.map(dto => GatheringMapper.toEntity(dto, currentUserId)),
};
```

---

## ✅ 일반적인 변환 패턴

### 1. 날짜/시간 변환 (string → Date)
```typescript
const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return date;
};

export const PaymentMapper = {
  toEntity: (dto: PaymentDto): PaymentEntity => ({
    id: dto.id,
    paidAt: parseDate(dto.paid_at),
    createdAt: parseDate(dto.created_at),
  }),
};
```

### 2. null/undefined 처리
```typescript
export const MemberMapper = {
  toEntity: (dto: MemberDto): MemberEntity => ({
    id: dto.id,
    nickname: dto.nickname,
    profileImage: dto.profile_image ?? 'default_profile.png',
    bio: dto.bio ?? '',
  }),
};
```

### 3. 필드명 변환 (snake_case → camelCase)
```typescript
export const PaymentItemMapper = {
  toEntity: (dto: PaymentItemDto): PaymentItemEntity => ({
    id: dto.id,
    menuName: dto.menu_name,           // snake → camel
    unitPrice: dto.unit_price,         // snake → camel
    totalQuantity: dto.total_quantity, // snake → camel
    assignedMembers: dto.assigned_members.map(toAssignedMemberEntity),
  }),
};
```

### 4. 계산된 필드 추가
```typescript
export const GatheringMapper = {
  toEntity: (dto: GatheringDto, currentUserId: number): GatheringEntity => ({
    id: dto.id,
    hostId: dto.host_id,
    memberCount: dto.member_count,
    // Entity에만 존재하는 계산된 필드
    isHost: dto.host_id === currentUserId,
    isActive: dto.is_active,
  }),
};
```

---

## ✅ 실전 예시

### 1. N빵 뽑기 결과 Mapper
```typescript
// features/nbang/data/nbang_draw/nbangDrawMapper.ts
import { NbangDrawResultDto, DrawnMemberDto } from './nbangDrawDto';
import { NbangDrawResultEntity, DrawnMemberEntity } from '../../domain/nbang_draw/NbangDrawEntity';

const toDrawnMemberEntity = (dto: DrawnMemberDto): DrawnMemberEntity => ({
  name: dto.name,
  amount: dto.amount,
});

export const NbangDrawMapper = {
  toEntity: (dto: NbangDrawResultDto): NbangDrawResultEntity => ({
    success: dto.success,
    drawnMembers: dto.data.user.map(toDrawnMemberEntity),
  }),
};
```

### 2. 영수증 OCR Mapper (복잡한 파싱)
```typescript
// features/payment/data/receipt_scan/receiptScanMapper.ts
import { ReceiptScanDto, ReceiptItemDto } from './receiptScanDto';
import { ReceiptScanEntity, ReceiptItemEntity, OcrStatus } from '../../domain/receipt_scan/ReceiptScanEntity';

const parseDate = (dateStr: string | null | undefined): Date | undefined => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
};

const toReceiptItemEntity = (dto: ReceiptItemDto): ReceiptItemEntity => ({
  name: dto.name,
  price: dto.price,
  quantity: dto.quantity,
  totalPrice: dto.price * dto.quantity,
});

const resolveOcrStatus = (dto: ReceiptScanDto): OcrStatus => {
  if (dto.confidence < 0.3) return 'failed';
  if (!dto.items || dto.items.length === 0) return 'items_missing';
  if (dto.confidence < 0.7) return 'amount_uncertain';
  return 'success';
};

export const ReceiptScanMapper = {
  toEntity: (dto: ReceiptScanDto): ReceiptScanEntity => ({
    storeName: dto.store_name ?? undefined,
    paidAt: parseDate(dto.paid_at),
    totalAmount: dto.total_amount,
    items: (dto.items ?? []).map(toReceiptItemEntity),
    ocrStatus: resolveOcrStatus(dto),
    isReliable: dto.confidence >= 0.7,
  }),
};
```

### 3. 페이지네이션 Mapper
```typescript
// shared/mappers/paginationMapper.ts
import { PaginatedDto } from '../types/Pagination';

export const createPaginationMapper = <Dto, Entity>(
  itemMapper: (dto: Dto) => Entity,
) => ({
  toEntity: (dto: PaginatedDto<Dto>) => ({
    items: dto.content.map(itemMapper),
    totalElements: dto.total_elements,
    totalPages: dto.total_pages,
    currentPage: dto.current_page,
    pageSize: dto.page_size,
    hasNext: dto.has_next,
    hasPrevious: dto.current_page > 0,
  }),
});

// 사용 예시
const gatheringPaginationMapper = createPaginationMapper(
  (dto: GatheringDto) => GatheringMapper.toEntity(dto, currentUserId),
);
const paginatedEntity = gatheringPaginationMapper.toEntity(paginatedDto);
```

---

## ✅ Mapper 메서드 네이밍 규칙

| 메서드명 | 용도 | 시그니처 |
|---------|------|---------|
| `toEntity` | DTO → Entity (단건) | `(dto: Dto) => Entity` |
| `fromEntity` | Entity → DTO (단건) | `(entity: Entity) => Dto` |
| `toEntityList` | DTO[] → Entity[] | `(dtos: Dto[]) => Entity[]` |
| `fromEntityList` | Entity[] → DTO[] | `(entities: Entity[]) => Dto[]` |

Private 헬퍼 함수:
| 함수명 | 용도 |
|--------|------|
| `parseXxx` | 문자열 파싱 |
| `normalizeXxx` | 데이터 정규화 |
| `convertXxx` | 타입 변환 |
| `resolveXxx` | 조건부 값 결정 |

---

## ✅ 에러 처리

```typescript
export const ReceiptScanMapper = {
  toEntity: (dto: ReceiptScanDto): ReceiptScanEntity => {
    if (dto.total_amount < 0) {
      throw new RangeError(`total_amount는 0 이상이어야 합니다: ${dto.total_amount}`);
    }
    if (dto.confidence < 0 || dto.confidence > 1) {
      throw new RangeError(`confidence out of range: ${dto.confidence}`);
    }
    return {
      totalAmount: dto.total_amount,
      isReliable: dto.confidence >= 0.7,
      // ...
    };
  },
};
```

---

## ✅ 주의사항

### ❌ 하지 말아야 할 것

1. **비즈니스 로직 포함**
```typescript
// ❌ 피하기
export const GatheringMapper = {
  toEntity: (dto: GatheringDto): GatheringEntity => {
    if (!dto.is_active) {
      throw new Error('비활성 모임방입니다'); // ❌ 비즈니스 로직 금지
    }
    return { ... };
  },
};
// ✅ Repository나 UseCase에서 처리
```

2. **API 호출**
```typescript
// ❌ 피하기
export const MemberMapper = {
  toEntity: async (dto: MemberDto): Promise<MemberEntity> => {
    const profile = await fetchProfile(dto.id); // ❌ API 호출 금지
    return { ...dto, profile };
  },
};
```

3. **상태 변경 (사이드 이펙트)**
```typescript
// ❌ 피하기
let callCount = 0;
export const GatheringMapper = {
  toEntity: (dto: GatheringDto): GatheringEntity => {
    callCount++; // ❌ 사이드 이펙트 금지
    return { ... };
  },
};
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **DTO 설계**: `dto.md`
- **DataSource 설계**: `data_source.md`