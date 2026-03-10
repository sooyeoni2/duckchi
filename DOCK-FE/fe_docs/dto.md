# 📦 DTO 설계 가이드

## ✅ 목적
DTO(Data Transfer Object)는 API 응답/요청 데이터를 표현하는 객체로,
네트워크 레이어와 도메인 레이어 사이의 데이터 전송을 담당합니다.

---

## 🧱 설계 원칙
- **API 구조 일치**: JSON 구조와 정확히 일치해야 함
- **직렬화/역직렬화**: Zod 스키마로 런타임 검증
- **Entity와 분리**: DTO는 Entity를 알지 못함 (Mapper가 변환)
- **불변성**: readonly 또는 const assertion 사용

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── data/
            └── {sub_feature}/
                └── {name}Dto.ts    # DTO 타입 + Zod 스키마
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ 기본 DTO 구조

### 1. 간단한 DTO (TypeScript 인터페이스 + Zod)
```typescript
// features/auth/data/login/loginDto.ts
import { z } from 'zod';

export const loginDtoSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  nickname: z.string(),
  profile_image: z.string().url().nullable().optional(),
  access_token: z.string(),
  refresh_token: z.string(),
});

export type LoginDto = z.infer<typeof loginDtoSchema>;
```

### 2. 중첩된 객체가 있는 DTO
```typescript
// features/gathering/data/gathering_list/gatheringDto.ts
import { z } from 'zod';

const memberDtoSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  profile_image: z.string().nullable().optional(),
});

export const gatheringDtoSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: z.string(),
  host_id: z.number(),
  members: z.array(memberDtoSchema),
  member_count: z.number(),
  created_at: z.string(),
  is_active: z.boolean(),
});

export type GatheringDto = z.infer<typeof gatheringDtoSchema>;
export type MemberDto = z.infer<typeof memberDtoSchema>;
```

### 3. 페이지네이션 응답 DTO
```typescript
// shared/types/Pagination.ts
import { z } from 'zod';

export const createPaginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    content: z.array(itemSchema),
    total_elements: z.number(),
    total_pages: z.number(),
    current_page: z.number(),
    page_size: z.number(),
    has_next: z.boolean(),
  });

export type PaginatedDto<T> = {
  content: T[];
  total_elements: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
};

// 사용 예시
const paginatedGatheringSchema = createPaginatedSchema(gatheringDtoSchema);
type PaginatedGatheringDto = z.infer<typeof paginatedGatheringSchema>;
```

---

## ✅ API 응답 공통 래퍼

```typescript
// shared/types/ApiResponse.ts
import { z } from 'zod';

export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
  });

export const createApiErrorSchema = () =>
  z.object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }),
  });

// 사용 예시
const loginResponseSchema = createApiResponseSchema(loginDtoSchema);
type LoginResponse = z.infer<typeof loginResponseSchema>;
```

---

## ✅ Zod 스키마 활용 패턴

### 1. 기본값 설정
```typescript
export const gatheringDtoSchema = z.object({
  id: z.number(),
  title: z.string(),
  member_count: z.number().default(0),
  category: z.string().default('기타'),
  members: z.array(memberDtoSchema).default([]),
});
```

### 2. Nullable vs Optional
```typescript
export const memberDtoSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  // nullable: null 허용
  profile_image: z.string().nullable(),
  // optional: 키 자체가 없어도 됨
  bio: z.string().optional(),
  // nullable + optional: null이거나 없어도 됨
  phone: z.string().nullish(),
});
```

### 3. Enum 처리
```typescript
const settlementMethodSchema = z.enum(['equal_split', 'menu_assign', 'custom']);
export type SettlementMethod = z.infer<typeof settlementMethodSchema>;

export const paymentDtoSchema = z.object({
  id: z.number(),
  total_amount: z.number(),
  settlement_method: settlementMethodSchema,
});
```

### 4. 날짜 처리 (문자열로 받기)
```typescript
export const receiptDtoSchema = z.object({
  id: z.number(),
  // DateTime은 String으로 받아서 Mapper에서 변환
  paid_at: z.string(),         // "2024-05-15T18:30:00Z"
  created_at: z.string(),
});
// Mapper에서 변환: paidAt: new Date(dto.paid_at)
```

### 5. 런타임 검증 (DataSource에서 사용)
```typescript
const response = await axiosClient.get('/api/gatherings');
const parsed = gatheringDtoSchema.array().safeParse(response.data.data.content);

if (!parsed.success) {
  console.error('DTO 파싱 실패:', parsed.error);
  throw new Error('Invalid response format');
}

return parsed.data; // GatheringDto[]
```

---

## ✅ Request DTO (요청 데이터)

```typescript
// features/gathering/data/gathering_create/gatheringCreateDto.ts
import { z } from 'zod';

export const createGatheringRequestSchema = z.object({
  title: z.string().min(1).max(20),
  category: z.string(),
  member_ids: z.array(z.number()),
  default_limit: z.number().optional(),
});

export type CreateGatheringRequest = z.infer<typeof createGatheringRequestSchema>;
```

---

## ✅ 실전 예시

### 1. N빵 뽑기 결과 DTO
```typescript
// features/nbang/data/nbang_draw/nbangDrawDto.ts
import { z } from 'zod';

const drawnMemberDtoSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

export const nbangDrawResultDtoSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: z.array(drawnMemberDtoSchema),
  }),
});

export type NbangDrawResultDto = z.infer<typeof nbangDrawResultDtoSchema>;
export type DrawnMemberDto = z.infer<typeof drawnMemberDtoSchema>;
```

### 2. 영수증 OCR DTO
```typescript
// features/payment/data/receipt_scan/receiptScanDto.ts
import { z } from 'zod';

const receiptItemDtoSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export const receiptScanDtoSchema = z.object({
  store_name: z.string().nullable().optional(),
  paid_at: z.string().nullable().optional(),
  total_amount: z.number(),
  items: z.array(receiptItemDtoSchema).nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export type ReceiptScanDto = z.infer<typeof receiptScanDtoSchema>;
export type ReceiptItemDto = z.infer<typeof receiptItemDtoSchema>;
```

### 3. 정산 내역 DTO
```typescript
// features/payment/data/payment_list/paymentDto.ts
import { z } from 'zod';

const assignedMemberDtoSchema = z.object({
  member_id: z.number(),
  member_name: z.string(),
  quantity: z.number(),
  amount: z.number(),
});

export const paymentItemDtoSchema = z.object({
  id: z.number(),
  menu_name: z.string(),
  unit_price: z.number(),
  total_quantity: z.number(),
  assigned_members: z.array(assignedMemberDtoSchema),
});

export type PaymentItemDto = z.infer<typeof paymentItemDtoSchema>;
export type AssignedMemberDto = z.infer<typeof assignedMemberDtoSchema>;
```

---

## ✅ DTO vs Entity 비교

| 항목 | DTO | Entity |
|-----|-----|--------|
| **위치** | `data/` 레이어 | `domain/` 레이어 |
| **목적** | API 데이터 전송 | 비즈니스 로직 |
| **날짜 타입** | `string` (ISO 8601) | `Date` |
| **필드명** | snake_case (API 응답) | camelCase |
| **검증** | Zod 스키마 | 없음 |
| **직렬화** | JSON 호환 | 불필요 |
| **의존성** | API 구조에 의존 | 독립적 |

### 예시 비교
```typescript
// DTO (API 응답 구조 - snake_case)
export interface GatheringDto {
  id: number;
  title: string;
  host_id: number;
  member_count: number;
  created_at: string;     // string
  is_active: boolean;
}

// Entity (비즈니스 로직 - camelCase)
export interface GatheringEntity {
  id: number;
  title: string;
  hostId: number;
  memberCount: number;
  createdAt: Date;        // Date
  isActive: boolean;
  isHost: boolean;        // 계산된 필드 (현재 사용자 === hostId)
}
```

---

## ✅ 주의사항

### ❌ DTO에서 하지 말아야 할 것

1. **비즈니스 로직 포함**
```typescript
// ❌ 피하기
export interface GatheringDto {
  host_id: number;
  // ❌ DTO에 비즈니스 로직 금지
  get isHost() { return this.host_id === currentUserId; }
}

// ✅ Entity에서 처리
export interface GatheringEntity {
  hostId: number;
  isHost: boolean;  // Mapper에서 계산
}
```

2. **Entity로의 직접 변환**
```typescript
// ❌ 피하기
export interface GatheringDto {
  created_at: string;
  toEntity(): GatheringEntity;  // ❌
}

// ✅ Mapper에서 처리
export const GatheringMapper = {
  toEntity: (dto: GatheringDto): GatheringEntity => ({
    createdAt: new Date(dto.created_at),
    // ...
  }),
};
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **Mapper 설계**: `mapper.md`
- **DataSource 설계**: `data_source.md`