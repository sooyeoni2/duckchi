# 🧩 Component 설계 가이드

## ✅ 목적
Component는 재사용 가능한 UI 조각으로,
화면을 구성하는 작은 단위의 React Native 컴포넌트를 독립적으로 관리합니다.

---

## 🧱 설계 원칙
- **재사용성**: 여러 화면에서 사용 가능하도록 설계
- **단일 책임**: 하나의 명확한 역할만 수행
- **독립성**: 외부 의존성 최소화 (Props로 데이터 수신)
- **구성 가능성**: 작은 Component를 조합하여 큰 Component 구성

---

## ✅ 파일 구조 및 위치

### 1. 화면별 Component (Feature Component)
```
src/
└── features/
    └── {feature_name}/
        └── presentation/
            └── {screen_name}/
                └── components/            # 화면별 Component ✨
                    ├── GatheringCard.tsx
                    ├── MemberAssignModal.tsx
                    └── ...
```

### 2. 공통 Component (Shared Component)
```
src/
└── shared/
    └── components/
        ├── buttons/
        │   ├── PrimaryButton.tsx          # 노란 주요 버튼 (#FCDD68)
        │   └── OutlineButton.tsx          # 외곽선 버튼
        ├── inputs/
        │   ├── CustomTextInput.tsx
        │   └── SearchInput.tsx
        ├── loading/
        │   ├── LoadingIndicator.tsx
        │   └── LoadingOverlay.tsx
        ├── feedback/
        │   ├── ErrorView.tsx
        │   ├── EmptyView.tsx
        │   └── ToastMessage.tsx
        └── layout/
            └── SafeAreaContainer.tsx
```

📎 전체 폴더 구조는 `folder.md` 참고

---

## ✅ Component 기본 구조

### 1. 모임방 카드 (Feature Component)
```typescript
// features/gathering/presentation/gathering_list/components/GatheringCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GatheringEntity } from '../../../domain/gathering_list/GatheringEntity';
import { colors } from '@core/theme/colors';

interface GatheringCardProps {
  gathering: GatheringEntity;
  onPress?: () => void;
}

const GatheringCard: React.FC<GatheringCardProps> = ({ gathering, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.title}>{gathering.title}</Text>
        {gathering.isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>방장</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.category}>{gathering.category}</Text>
        <Text style={styles.memberCount}>{gathering.memberCount}명</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  hostBadge: {
    backgroundColor: '#FCDD68',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hostBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111',
  },
  meta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  category: {
    fontSize: 12,
    color: '#999',
  },
  memberCount: {
    fontSize: 12,
    color: '#999',
  },
});

export default GatheringCard;
```

### 2. 멤버 지정 모달 (Feature Component)
```typescript
// features/payment/presentation/receipt_scan/components/MemberAssignModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { MemberEntity } from '../../../domain/payment_list/PaymentEntity';

interface MemberAssignItem {
  member: MemberEntity;
  isSelected: boolean;
  quantity: number;
}

interface MemberAssignModalProps {
  visible: boolean;
  members: MemberEntity[];
  menuName: string;
  totalQuantity: number;
  onConfirm: (assignments: MemberAssignItem[]) => void;
  onDismiss: () => void;
}

const MemberAssignModal: React.FC<MemberAssignModalProps> = ({
  visible,
  members,
  menuName,
  totalQuantity,
  onConfirm,
  onDismiss,
}) => {
  const [assignments, setAssignments] = useState<MemberAssignItem[]>(
    members.map(m => ({ member: m, isSelected: false, quantity: 0 })),
  );

  const assignedTotal = assignments.reduce((sum, a) => sum + (a.isSelected ? a.quantity : 0), 0);

  const toggleMember = (memberId: number) => {
    setAssignments(prev =>
      prev.map(a =>
        a.member.id === memberId
          ? { ...a, isSelected: !a.isSelected, quantity: !a.isSelected ? 1 : 0 }
          : a,
      ),
    );
  };

  const changeQuantity = (memberId: number, delta: number) => {
    setAssignments(prev =>
      prev.map(a =>
        a.member.id === memberId
          ? { ...a, quantity: Math.max(0, a.quantity + delta) }
          : a,
      ),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.menuName}>{menuName}</Text>
          <Text style={styles.subtitle}>배정 {assignedTotal} / 총 {totalQuantity}개</Text>

          {assignments.map(({ member, isSelected, quantity }) => (
            <View key={member.id} style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.nickname.charAt(0)}</Text>
              </View>
              <Text style={styles.nickname}>{member.nickname}</Text>
              <Switch
                value={isSelected}
                onValueChange={() => toggleMember(member.id)}
                trackColor={{ true: '#FCDD68' }}
                thumbColor="#111"
              />
              {isSelected && (
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => changeQuantity(member.id, -1)}>
                    <Text style={styles.stepBtn}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{quantity}</Text>
                  <TouchableOpacity onPress={() => changeQuantity(member.id, 1)}>
                    <Text style={styles.stepBtn}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.confirmBtn, assignedTotal !== totalQuantity && styles.confirmBtnDisabled]}
            onPress={() => onConfirm(assignments.filter(a => a.isSelected))}
            disabled={assignedTotal !== totalQuantity}
          >
            <Text style={styles.confirmBtnText}>확인 ({assignedTotal}명)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default MemberAssignModal;
```

### 3. 공통 버튼 (Shared Component)
```typescript
// shared/components/buttons/PrimaryButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface PrimaryButtonProps {
  text: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  onPress,
  isLoading = false,
  disabled = false,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color="#111" />
      ) : (
        <Text style={styles.text}>{text}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FCDD68',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
});

export default PrimaryButton;
```

---

## ✅ Feature vs Shared 구분 기준

| 구분 | Feature Component | Shared Component |
|-----|-----------------|-----------------|
| **사용 범위** | 특정 화면에서만 사용 | 여러 feature에서 공통 사용 |
| **위치** | `features/.../components/` | `shared/components/` |
| **도메인 의존성** | Entity를 직접 받아도 됨 | 원시 타입(string, number) 선호 |
| **예시** | `GatheringCard`, `MemberAssignModal` | `PrimaryButton`, `LoadingIndicator` |

---

## ✅ Props 설계 원칙

```typescript
// ✅ 명확한 Props 타입 정의
interface DrawResultCardProps {
  memberName: string;
  amount: number;
  isWinner: boolean;       // 당첨 여부
  onPress?: () => void;    // optional 콜백
}

// ✅ Entity를 직접 받는 경우 (Feature Component)
interface GatheringCardProps {
  gathering: GatheringEntity;
  onPress?: () => void;
}
```

---

## ✅ 주의사항

### ❌ 하지 말아야 할 것

1. **Component에서 직접 API 호출**
```typescript
// ❌ 피하기
const GatheringCard = ({ gatheringId }: { gatheringId: number }) => {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(`/api/gatherings/${gatheringId}`).then(...); // ❌
  }, []);
};

// ✅ ViewModel에서 데이터를 내려받아 사용
const GatheringCard = ({ gathering }: { gathering: GatheringEntity }) => { ... };
```

2. **Shared Component에서 도메인 로직**
```typescript
// ❌ 피하기
const PrimaryButton = ({ gathering }: { gathering: GatheringEntity }) => {
  const isDisabled = !gathering.isActive; // ❌ 도메인 의존
};

// ✅ 순수하게 Props로만 제어
const PrimaryButton = ({ disabled }: { disabled: boolean }) => { ... };
```

---

## 📎 관련 문서
- **폴더 구조**: `folder.md`
- **네이밍 규칙**: `naming.md`
- **Screen 설계**: `screen.md`
- **ViewModel 설계**: `viewmodel.md`