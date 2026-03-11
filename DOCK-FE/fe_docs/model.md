# 📦 Model 설계 가이드 (Types + Service)

## ✅ 목적
Model은 MVVM에서 데이터를 담당하는 계층으로,
타입 정의(`{name}Types.ts`)와 API 호출(`{name}Service.ts`) 두 파일로 구성됩니다.

---

## 🧱 설계 원칙
- **타입 명확성**: API 응답 타입과 앱 내부 타입을 명시적으로 정의
- **Service 단순화**: 함수 단위로 API를 호출하고 앱 타입으로 변환하여 반환
- **Zod 검증**: API 응답은 Zod로 런타임 검증
- **에러는 throw**: Service는 에러를 throw, ViewModel이 처리

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── models/
            ├── {name}Types.ts    # 타입 정의
            └── {name}Service.ts  # API 호출
```

---

## ✅ Types 파일 (`{name}Types.ts`)

API 응답 타입과 앱 내부에서 사용하는 타입을 함께 정의합니다.

### 기본 구조
```typescript
// features/gathering/models/gatheringTypes.ts
import { z } from 'zod';

// 1. API 응답 스키마 (Zod)
export const gatheringResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  host_id: z.number(),
  member_count: z.number(),
  created_at: z.string(),
  is_active: z.boolean(),
});

// 2. API 응답 타입 (Zod에서 추론)
export type GatheringResponse = z.infer<typeof gatheringResponseSchema>;

// 3. 앱 내부 타입 (camelCase, Date 등 변환됨)
export interface GatheringItem {
  id: number;
  title: string;
  hostId: number;
  memberCount: number;
  createdAt: Date;
  isActive: boolean;
}

// 4. 요청 파라미터 타입
export interface GetGatheringsParams {
  page?: number;
  size?: number;
}

export interface CreateGatheringRequest {
  title: string;
  category: string;
  memberIds: number[];
}
```

### 중첩 구조 예시
```typescript
// features/payment/models/paymentTypes.ts
import { z } from 'zod';

const paymentItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
});

export const receiptResponseSchema = z.object({
  id: z.number(),
  store_name: z.string(),
  total_amount: z.number(),
  items: z.array(paymentItemSchema),
  paid_at: z.string(),
});

export type ReceiptResponse = z.infer<typeof receiptResponseSchema>;
export type PaymentItemResponse = z.infer<typeof paymentItemSchema>;

export interface ReceiptItem {
  id: number;
  storeName: string;
  totalAmount: number;
  items: PaymentItem[];
  paidAt: Date;
}

export interface PaymentItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}
```

---

## ✅ Service 파일 (`{name}Service.ts`)

API를 호출하고 응답을 앱 타입으로 변환하여 반환합니다.

### 기본 구조
```typescript
// features/gathering/models/gatheringService.ts
import { axiosClient } from '@core/network/axiosClient';
import {
  gatheringResponseSchema,
  GatheringItem,
  GatheringResponse,
  GetGatheringsParams,
  CreateGatheringRequest,
} from './gatheringTypes';

// API 응답 → 앱 타입 변환 함수 (Service 파일 내부에 위치)
const toGatheringItem = (res: GatheringResponse): GatheringItem => ({
  id: res.id,
  title: res.title,
  hostId: res.host_id,
  memberCount: res.member_count,
  createdAt: new Date(res.created_at),
  isActive: res.is_active,
});

// 목록 조회
export const getGatherings = async (params?: GetGatheringsParams): Promise<GatheringItem[]> => {
  const response = await axiosClient.get('/gatherings', { params });
  const validated = z.array(gatheringResponseSchema).parse(response.data);
  return validated.map(toGatheringItem);
};

// 단건 조회
export const getGatheringById = async (id: number): Promise<GatheringItem> => {
  const response = await axiosClient.get(`/gatherings/${id}`);
  const validated = gatheringResponseSchema.parse(response.data);
  return toGatheringItem(validated);
};

// 생성
export const createGathering = async (data: CreateGatheringRequest): Promise<GatheringItem> => {
  const response = await axiosClient.post('/gatherings', data);
  const validated = gatheringResponseSchema.parse(response.data);
  return toGatheringItem(validated);
};

// 삭제
export const deleteGathering = async (id: number): Promise<void> => {
  await axiosClient.delete(`/gatherings/${id}`);
};
```

### 페이지네이션 응답 처리
```typescript
// shared/types/Pagination.ts
export interface PaginatedResult<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

// features/gathering/models/gatheringService.ts
export const getGatheringsPaged = async (
  params: GetGatheringsParams
): Promise<PaginatedResult<GatheringItem>> => {
  const response = await axiosClient.get('/gatherings', { params });
  const { content, total_elements, total_pages, current_page, page_size } = response.data;

  return {
    items: z.array(gatheringResponseSchema).parse(content).map(toGatheringItem),
    totalElements: total_elements,
    totalPages: total_pages,
    currentPage: current_page,
    hasMore: content.length >= (params.size ?? 20),
  };
};
```

### FormData 업로드 처리 (OCR 등)
```typescript
// features/payment/models/paymentService.ts
export const scanReceipt = async (imageUri: string): Promise<ReceiptItem> => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'receipt.jpg',
  } as any);

  const response = await axiosClient.post('/receipts/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const validated = receiptResponseSchema.parse(response.data);
  return toReceiptItem(validated);
};
```

---

## ✅ Zod 검증을 쓸 때와 안 쓸 때

| 상황 | Zod 사용 여부 |
|------|-------------|
| 외부 API 응답 | ✅ 사용 (런타임 안전성) |
| 내부 상태 타입 | ❌ TypeScript만으로 충분 |
| 간단한 단건 응답 | 선택적 사용 |

---

## ✅ 타입 변환 (Response → Item)

변환 함수는 Service 파일 내부에 두고 외부로 export하지 않습니다.

```typescript
// ✅ Service 내부 private 함수
const toGatheringItem = (res: GatheringResponse): GatheringItem => ({
  id: res.id,
  title: res.title,
  hostId: res.host_id,           // snake_case → camelCase
  createdAt: new Date(res.created_at), // string → Date
});
```

---

## ✅ 에러 처리

Service는 에러를 직접 처리하지 않고 throw합니다.
ViewModel에서 try-catch로 처리합니다.

```typescript
// ✅ Service - 그냥 throw
export const getGatherings = async (): Promise<GatheringItem[]> => {
  const response = await axiosClient.get('/gatherings'); // Axios 에러는 interceptor에서 처리
  return z.array(gatheringResponseSchema).parse(response.data).map(toGatheringItem);
};

// ✅ ViewModel - try-catch로 처리
const loadGatherings = async () => {
  setState({ status: 'loading' });
  try {
    const items = await getGatherings();
    setState({ status: 'loaded', items });
  } catch (error) {
    setState({ status: 'error', message: error instanceof Error ? error.message : '오류 발생' });
  }
};
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **ViewModel 설계**: `viewmodel.md`
- **State 관리**: `state.md`
