# 🌐 DataSource 설계 가이드

## ✅ 목적
DataSource는 외부 데이터와의 연결 지점을 담당하며,
Axios를 이용한 API 호출, LocalStorage 접근 등을 수행하는 실제 입출력 계층입니다.
Repository는 이 계층을 통해 데이터를 요청하고, 예외 상황을 처리합니다.

---

## 🧱 설계 원칙
- **항상 인터페이스 정의 → 구현체 분리**
- 실제 API 구현체 외에 Mock 구현도 병행 가능
- **Exception은 그대로 throw, 가공은 Repository에서 처리**
- **Zod 스키마로 응답 유효성 검증**

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── data/
            └── {sub_feature}/
                └── dataSource/
                    ├── I{Name}DataSource.ts           # 인터페이스
                    ├── {Name}DataSourceImpl.ts        # API 구현
                    └── Mock{Name}DataSource.ts        # Mock 구현
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ 네이밍 및 클래스 구성

### 1. 인터페이스
```typescript
// features/auth/data/login/dataSource/ILoginDataSource.ts
import { LoginDto } from '../loginDto';

export interface ILoginDataSource {
  fetchLogin(email: string, password: string): Promise<LoginDto>;
  logout(): Promise<void>;
}
```

### 2. API 구현체
```typescript
// features/auth/data/login/dataSource/LoginDataSourceImpl.ts
import { axiosClient } from '@core/network/axiosClient';
import { LoginDto, loginDtoSchema } from '../loginDto';
import { ILoginDataSource } from './ILoginDataSource';

export class LoginDataSourceImpl implements ILoginDataSource {
  // ❌ try-catch 하지 않음 - 예외는 그대로 throw
  async fetchLogin(email: string, password: string): Promise<LoginDto> {
    const response = await axiosClient.post('/api/auth/login', { email, password });
    const parsed = loginDtoSchema.parse(response.data.data);
    return parsed;
  }

  async logout(): Promise<void> {
    await axiosClient.post('/api/auth/logout');
  }
}
```

### 3. Mock 구현체
```typescript
// features/auth/data/login/dataSource/MockLoginDataSource.ts
import { LoginDto } from '../loginDto';
import { ILoginDataSource } from './ILoginDataSource';

export class MockLoginDataSource implements ILoginDataSource {
  async fetchLogin(email: string, password: string): Promise<LoginDto> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (password === 'wrong') {
      throw new Error('Invalid credentials');
    }

    return {
      id: 1,
      email,
      nickname: 'MockUser',
      profile_image: null,
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
    };
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

---

## ✅ Axios 클라이언트 설정

```typescript
// core/network/axiosClient.ts
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@core/constants/apiConstants';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(authRequestInterceptor);
axiosClient.interceptors.response.use(
  response => response,
  errorResponseInterceptor,
);
```

```typescript
// core/network/interceptors/authInterceptor.ts
import { InternalAxiosRequestConfig } from 'axios';
import { getStoredToken } from '@core/utils/tokenStorage';

export const authRequestInterceptor = async (
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};
```

---

## ✅ 메서드 네이밍 규칙

| 작업 | 메서드명 패턴 | HTTP 메서드 | 예시 |
|-----|-------------|-----------|------|
| 조회 (GET) | `fetch{Name}` | GET | `fetchGatherings`, `fetchPayments` |
| 생성 (POST) | `post{Name}` | POST | `postGathering`, `postPayment` |
| 수정 (PUT) | `put{Name}` | PUT | `putGathering` |
| 부분 수정 (PATCH) | `patch{Name}` | PATCH | `patchGathering` |
| 삭제 (DELETE) | `delete{Name}` | DELETE | `deleteGathering`, `deletePayment` |

📎 메서드명 등의 네이밍 규칙은 `naming.md`

---

## ✅ 예외 처리 전략

### ⚠️ 중요: DataSource에서는 예외를 처리하지 않습니다!

```typescript
// ❌ 잘못된 예시 - DataSource에서 try-catch 금지
export class GatheringDataSourceImpl implements IGatheringDataSource {
  async fetchGatherings(): Promise<GatheringDto[]> {
    try {
      const response = await axiosClient.get('/api/gatherings');
      return response.data.data.content;
    } catch (e) {
      throw new Error('Failed to fetch gatherings'); // ❌
    }
  }
}

// ✅ 올바른 예시 - 예외를 그대로 throw
export class GatheringDataSourceImpl implements IGatheringDataSource {
  async fetchGatherings(params: FetchGatheringsParams): Promise<GatheringDto[]> {
    const response = await axiosClient.get('/api/gatherings', {
      params: {
        page: params.page,
        size: params.size,
      },
    });

    const parsed = gatheringDtoSchema.array().parse(response.data.data.content);
    return parsed;
  }
}
```

**이유:**
- DataSource는 데이터를 가져오는 역할만 함
- 예외를 비즈니스 에러로 변환하는 것은 Repository의 책임
- 여러 DataSource 구현체가 같은 예외 처리 로직을 중복하지 않기 위함

---

## ✅ 실전 예시

### 1. 모임방 DataSource
```typescript
// features/gathering/data/gathering_list/dataSource/IGatheringDataSource.ts
import { GatheringDto } from '../gatheringDto';

export interface FetchGatheringsParams {
  page?: number;
  size?: number;
}

export interface IGatheringDataSource {
  fetchGatherings(params: FetchGatheringsParams): Promise<GatheringDto[]>;
  fetchGatheringById(id: number): Promise<GatheringDto>;
  postGathering(data: Record<string, unknown>): Promise<GatheringDto>;
  patchGathering(id: number, data: Record<string, unknown>): Promise<GatheringDto>;
  deleteGathering(id: number): Promise<void>;
}
```

```typescript
// features/gathering/data/gathering_list/dataSource/GatheringDataSourceImpl.ts
import { axiosClient } from '@core/network/axiosClient';
import { GatheringDto, gatheringDtoSchema } from '../gatheringDto';
import { FetchGatheringsParams, IGatheringDataSource } from './IGatheringDataSource';

export class GatheringDataSourceImpl implements IGatheringDataSource {
  async fetchGatherings(params: FetchGatheringsParams): Promise<GatheringDto[]> {
    const response = await axiosClient.get('/api/gatherings', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    });
    return gatheringDtoSchema.array().parse(response.data.data.content);
  }

  async fetchGatheringById(id: number): Promise<GatheringDto> {
    const response = await axiosClient.get(`/api/gatherings/${id}`);
    return gatheringDtoSchema.parse(response.data.data);
  }

  async postGathering(data: Record<string, unknown>): Promise<GatheringDto> {
    const response = await axiosClient.post('/api/gatherings', data);
    return gatheringDtoSchema.parse(response.data.data);
  }

  async patchGathering(id: number, data: Record<string, unknown>): Promise<GatheringDto> {
    const response = await axiosClient.patch(`/api/gatherings/${id}`, data);
    return gatheringDtoSchema.parse(response.data.data);
  }

  async deleteGathering(id: number): Promise<void> {
    await axiosClient.delete(`/api/gatherings/${id}`);
  }
}
```

### 2. 영수증 OCR DataSource (Multipart)
```typescript
// features/payment/data/receipt_scan/dataSource/IReceiptScanDataSource.ts
import { ReceiptScanDto } from '../receiptScanDto';

export interface IReceiptScanDataSource {
  postReceiptScan(imageData: FormData): Promise<ReceiptScanDto>;
}
```

```typescript
// features/payment/data/receipt_scan/dataSource/ReceiptScanDataSourceImpl.ts
import { axiosClient } from '@core/network/axiosClient';
import { ReceiptScanDto, receiptScanDtoSchema } from '../receiptScanDto';
import { IReceiptScanDataSource } from './IReceiptScanDataSource';

export class ReceiptScanDataSourceImpl implements IReceiptScanDataSource {
  async postReceiptScan(formData: FormData): Promise<ReceiptScanDto> {
    const response = await axiosClient.post('/api/payments/ocr', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return receiptScanDtoSchema.parse(response.data.data);
  }
}
```

### 3. N빵 뽑기 DataSource
```typescript
// features/nbang/data/nbang_draw/dataSource/INbangDrawDataSource.ts
import { NbangDrawResultDto } from '../nbangDrawDto';

export interface PostNbangDrawParams {
  gathering_id: number;
  draw_count: number;
  payment_ids: number[];
}

export interface INbangDrawDataSource {
  postNbangDraw(params: PostNbangDrawParams): Promise<NbangDrawResultDto>;
}
```

```typescript
// features/nbang/data/nbang_draw/dataSource/NbangDrawDataSourceImpl.ts
export class NbangDrawDataSourceImpl implements INbangDrawDataSource {
  async postNbangDraw(params: PostNbangDrawParams): Promise<NbangDrawResultDto> {
    const response = await axiosClient.post('/api/gatherings/nbang/draw', params);
    return nbangDrawResultDtoSchema.parse(response.data);
  }
}
```

---

## ✅ Mock DataSource 구현 시 주의사항

Mock DataSource에서 메모리 내 데이터를 관리하는 경우,
**모듈 레벨에서 인스턴스를 생성하여 싱글톤으로 유지**해야 합니다.

```typescript
// features/gathering/data/gathering_list/dataSource/MockGatheringDataSource.ts
export class MockGatheringDataSource implements IGatheringDataSource {
  private gatherings: GatheringDto[] = [];
  private nextId = 1;
  private initialized = false;

  private async initializeIfNeeded(): Promise<void> {
    if (this.initialized) return;
    this.gatherings = this.generateMockData();
    this.initialized = true;
  }

  private generateMockData(): GatheringDto[] {
    return [
      {
        id: this.nextId++,
        title: '팀 회식',
        category: '회식',
        host_id: 1,
        members: [
          { id: 1, nickname: '류병선', profile_image: null },
          { id: 2, nickname: '정우주', profile_image: null },
        ],
        member_count: 2,
        created_at: new Date().toISOString(),
        is_active: true,
      },
    ];
  }

  async fetchGatherings(params: FetchGatheringsParams): Promise<GatheringDto[]> {
    await this.initializeIfNeeded();
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    return this.gatherings.slice(page * size, (page + 1) * size);
  }

  async fetchGatheringById(id: number): Promise<GatheringDto> {
    await this.initializeIfNeeded();
    const gathering = this.gatherings.find(g => g.id === id);
    if (!gathering) throw new Error(`Gathering not found: ${id}`);
    return gathering;
  }

  async postGathering(data: Record<string, unknown>): Promise<GatheringDto> {
    await this.initializeIfNeeded();
    const newGathering: GatheringDto = {
      id: this.nextId++,
      title: data.title as string,
      category: data.category as string,
      host_id: 1,
      members: [],
      member_count: 0,
      created_at: new Date().toISOString(),
      is_active: true,
    };
    this.gatherings.push(newGathering);
    return newGathering;
  }

  async patchGathering(id: number, data: Record<string, unknown>): Promise<GatheringDto> {
    await this.initializeIfNeeded();
    const index = this.gatherings.findIndex(g => g.id === id);
    if (index === -1) throw new Error(`Gathering not found: ${id}`);
    this.gatherings[index] = { ...this.gatherings[index], ...data };
    return this.gatherings[index];
  }

  async deleteGathering(id: number): Promise<void> {
    await this.initializeIfNeeded();
    this.gatherings = this.gatherings.filter(g => g.id !== id);
  }
}

// ✅ 싱글톤으로 내보내기 (상태 유지)
export const mockGatheringDataSource = new MockGatheringDataSource();
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **DTO 설계**: `dto.md`
- **Mapper 설계**: `mapper.md`