# ⚙️ UseCase 설계 가이드

## ✅ 목적
UseCase는 **특정 비즈니스 유스케이스를 실행하는 단일 책임 클래스**로,
복잡한 비즈니스 로직이나 여러 Repository를 조합하는 작업을 담당합니다.

---

## 🧱 설계 원칙
- **단일 책임**: 하나의 UseCase는 하나의 작업만 수행
- **재사용성**: 여러 화면/기능에서 같은 로직을 재사용
- **테스트 용이성**: 비즈니스 로직을 독립적으로 테스트
- **선택적 사용**: 간단한 CRUD는 Repository 직접 호출, 복잡할 때만 UseCase 사용

---

## ✅ 파일 구조 및 위치

```
src/
└── features/
    └── {feature_name}/
        └── domain/
            └── {sub_feature}/
                ├── usecases/
                │   ├── {Action}{Name}UseCase.ts
                │   └── ...
                ├── {Name}Entity.ts
                └── I{Name}Repository.ts
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## 🤔 UseCase가 필요한 경우 vs 불필요한 경우

### ✅ UseCase가 **필요한** 경우

1. **여러 Repository 조합**
```typescript
// features/gathering/domain/gathering_detail/usecases/DelegateHostUseCase.ts
export class DelegateHostUseCase {
  constructor(
    private gatheringRepo: IGatheringRepository,
    private notificationRepo: INotificationRepository,
  ) {}

  async execute(gatheringId: number, newHostId: number): Promise<void> {
    // 1. 방장 위임
    await this.gatheringRepo.delegateHost(gatheringId, newHostId);
    // 2. 새 방장에게 알림
    await this.notificationRepo.sendHostDelegatedNotification(gatheringId, newHostId);
  }
}
```

2. **복잡한 비즈니스 검증 로직**
```typescript
// features/payment/domain/payment_list/usecases/AssignMenuMembersUseCase.ts
export class AssignMenuMembersUseCase {
  async execute(paymentId: number, assignments: MenuAssignment[]): Promise<PaymentEntity> {
    const payment = await this.paymentRepo.getPaymentById(paymentId);

    // 전체 수량 검증
    for (const item of payment.items) {
      const assigned = assignments
        .filter(a => a.menuItemId === item.id)
        .reduce((sum, a) => sum + a.quantity, 0);

      if (assigned !== item.totalQuantity) {
        throw new MenuAssignmentMismatchError(
          `${item.menuName}: 지정 수량(${assigned})이 총 수량(${item.totalQuantity})과 다릅니다`,
        );
      }
    }

    return await this.paymentRepo.updateAssignments(paymentId, assignments);
  }
}
```

3. **계산/분석 로직**
```typescript
// features/spendReport/domain/usecases/CalculateMonthlyReportUseCase.ts
export class CalculateMonthlyReportUseCase {
  execute(payments: PaymentEntity[]): MonthlyReport {
    const total = payments.reduce((sum, p) => sum + p.myAmount, 0);
    const byCategory = groupBy(payments, p => p.category);
    const trend = this.calculateTrend(payments);
    return { total, byCategory, trend };
  }
}
```

### ❌ UseCase가 **불필요한** 경우

간단한 CRUD는 **ViewModel에서 Repository 직접 호출**

```typescript
// ❌ 불필요한 UseCase
export class GetGatheringListUseCase {
  async execute(): Promise<GatheringEntity[]> {
    return await this.repository.getGatherings(); // 단순 위임만
  }
}

// ✅ ViewModel에서 직접 호출
export const useGatheringListViewModel = () => {
  const loadGatherings = async () => {
    setState({ status: 'loading' });
    try {
      const gatherings = await repository.getGatherings({ page: 0 });
      setState({ status: 'loaded', gatherings, ... });
    } catch (error) {
      setState({ status: 'error', message: error.message });
    }
  };
};
```

---

## ✅ UseCase 기본 구조

### 1. 방장 위임 UseCase
```typescript
// features/gathering/domain/gathering_detail/usecases/DelegateHostUseCase.ts
import { IGatheringRepository } from '../IGatheringRepository';
import { INotificationRepository } from '../../notification/INotificationRepository';

export class DelegateHostUseCase {
  constructor(
    private readonly gatheringRepo: IGatheringRepository,
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(gatheringId: number, newHostId: number): Promise<void> {
    const gathering = await this.gatheringRepo.getGatheringById(gatheringId);

    if (!gathering.isHost) {
      throw new NotHostError('방장만 위임할 수 있습니다');
    }

    await this.gatheringRepo.delegateHost(gatheringId, newHostId);
    await this.notificationRepo.sendHostDelegatedNotification(gatheringId, newHostId);
  }
}
```

### 2. 메뉴별 멤버 지정 UseCase
```typescript
// features/payment/domain/payment_list/usecases/AssignMenuMembersUseCase.ts
export interface MenuAssignment {
  menuItemId: number;
  memberId: number;
  quantity: number;
}

export class AssignMenuMembersUseCase {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async execute(
    paymentId: number,
    assignments: MenuAssignment[],
  ): Promise<PaymentEntity> {
    const payment = await this.paymentRepo.getPaymentById(paymentId);

    // 수량 검증
    for (const item of payment.items) {
      const totalAssigned = assignments
        .filter(a => a.menuItemId === item.id)
        .reduce((sum, a) => sum + a.quantity, 0);

      if (totalAssigned !== item.totalQuantity) {
        throw new MenuAssignmentMismatchError(
          `${item.menuName}: 지정 수량(${totalAssigned}) ≠ 총 수량(${item.totalQuantity})`,
        );
      }
    }

    return await this.paymentRepo.updateAssignments(paymentId, assignments);
  }
}
```

### 3. 소비 리포트 계산 UseCase (동기)
```typescript
// features/spendReport/domain/usecases/CalculateMonthlyReportUseCase.ts
export interface MonthlyReport {
  total: number;
  byCategory: Record<string, number>;
  averagePerMonth: number;
  topCategory: string;
}

export class CalculateMonthlyReportUseCase {
  execute(payments: PaymentEntity[], year: number, month: number): MonthlyReport {
    const filtered = payments.filter(
      p => p.paidAt.getFullYear() === year && p.paidAt.getMonth() + 1 === month,
    );

    const total = filtered.reduce((sum, p) => sum + p.myAmount, 0);

    const byCategory = filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + p.myAmount;
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)[0]?.[0] ?? '없음';

    return { total, byCategory, averagePerMonth: total, topCategory };
  }
}
```

---

## ✅ 네이밍 규칙

| 작업 | UseCase 네이밍 패턴 | 예시 |
|-----|-------------------|------|
| 조회 | `Get{Name}UseCase` | `GetGatheringListUseCase` |
| 생성 | `Create{Name}UseCase` | `CreateGatheringUseCase` |
| 수정 | `Update{Name}UseCase` | `UpdateGatheringUseCase` |
| 삭제 | `Delete{Name}UseCase` | `DeleteGatheringUseCase` |
| 위임 | `Delegate{Name}UseCase` | `DelegateHostUseCase` |
| 지정 | `Assign{Name}UseCase` | `AssignMenuMembersUseCase` |
| 계산 | `Calculate{Name}UseCase` | `CalculateMonthlyReportUseCase` |
| 처리 | `Process{Name}UseCase` | `ProcessReceiptOcrUseCase` |

UseCase 실행 메서드는 `execute` 로 통일합니다.

📎 네이밍 규칙 상세는 `naming.md` 참고

---

## ✅ ViewModel에서 UseCase 사용

```typescript
// features/gathering/presentation/gathering_detail/useGatheringDetailViewModel.ts
import { DelegateHostUseCase } from '../../domain/gathering_detail/usecases/DelegateHostUseCase';

const dataSource = new GatheringDataSourceImpl();
const repository = new GatheringRepositoryImpl(dataSource);
const notificationRepository = new NotificationRepositoryImpl(notificationDataSource);
const delegateHostUseCase = new DelegateHostUseCase(repository, notificationRepository);

export const useGatheringDetailViewModel = (gatheringId: number) => {
  const { state, setState } = useGatheringDetailStore();

  const delegateHost = useCallback(async (newHostId: number): Promise<boolean> => {
    if (state.status !== 'loaded') return false;

    setState({ ...state, isDelegating: true });

    try {
      await delegateHostUseCase.execute(gatheringId, newHostId);
      setState({ ...state, isDelegating: false, isHost: false });
      return true;
    } catch (error) {
      if (error instanceof NotHostError) {
        setState({ ...state, isDelegating: false });
      }
      return false;
    }
  }, [state, setState, gatheringId]);

  return { state, delegateHost };
};
```

---

## ✅ 에러 클래스

```typescript
// core/errors/AppError.ts
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// features/gathering/domain/errors/GatheringErrors.ts
import { AppError } from '@core/errors/AppError';

export class NotHostError extends AppError {
  constructor(message = '방장만 수행할 수 있습니다') {
    super(message);
    this.name = 'NotHostError';
  }
}

// features/payment/domain/errors/PaymentErrors.ts
export class MenuAssignmentMismatchError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'MenuAssignmentMismatchError';
  }
}
```

---

## ✅ UseCase 판단 기준 요약

| 상황 | UseCase 필요? | 이유 |
|-----|-------------|------|
| 단순 CRUD | ❌ | ViewModel에서 Repository 직접 호출 |
| 여러 Repository 조합 | ✅ | 복잡한 로직 캡슐화 |
| 복잡한 비즈니스 검증 | ✅ | 재사용성, 테스트 용이성 |
| 계산/분석 로직 | ✅ | 순수 함수로 독립 테스트 |
| 여러 단계의 작업 | ✅ | 순서 보장 |
| 단순 조회 | ❌ | Repository에서 처리 가능 |

---

## ✅ 주의사항

### ❌ 하지 말아야 할 것

1. **UI 로직 포함**
```typescript
// ❌ 피하기
export class DelegateHostUseCase {
  async execute(...): Promise<void> {
    await this.gatheringRepo.delegateHost(...);
    navigation.navigate('GatheringDetail'); // ❌ UseCase에서 Navigation 금지
    Alert.alert('위임 완료!');              // ❌ Alert 금지
  }
}

// ✅ ViewModel에서 처리
const handleDelegate = async (newHostId: number) => {
  const success = await delegateHostUseCase.execute(gatheringId, newHostId);
  if (success) {
    navigation.navigate('GatheringDetail', { gatheringId });
  }
};
```

2. **너무 단순한 로직을 UseCase로**
```typescript
// ❌ 불필요
export class GetGatheringByIdUseCase {
  async execute(id: number): Promise<GatheringEntity> {
    return await this.repository.getGatheringById(id); // 단순 위임
  }
}
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **ViewModel 설계**: `viewmodel.md`
- **DataSource 설계**: `data_source.md`