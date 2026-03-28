import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { OcrReceiptDraft } from '../../../models/types/paymentTypes';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

interface PaymentOcrEditorViewProps {
  draft: OcrReceiptDraft;
  onStoreNameChange: (value: string) => void;
  onTotalAmountChange: (value: string) => void;
  onItemNameChange: (itemId: number, value: string) => void;
  onItemUnitPriceChange: (itemId: number, value: string) => void;
  onItemQuantityChange: (itemId: number, value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: number) => void;
  onNext: () => void;
}

const formatDate = (date: Date | null): string => {
  if (date == null) {
    return '시간 정보 없음';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}`;
};

const formatAmount = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

/**
 * 💡 조작감 개선을 위한 개별 항목 행 컴포넌트
 */
function OcrItemEditableRow({
  item,
  isEditing,
  onPress,
  onNameChange,
  onUnitPriceChange,
  onQuantityChange,
  onRemove,
  onDone,
}: {
  item: any;
  isEditing: boolean;
  onPress: () => void;
  onNameChange: (v: string) => void;
  onUnitPriceChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onRemove: () => void;
  onDone: () => void;
}) {
  // 수량과 단가는 입력 중 '0'이나 빈 칸이 될 수 있어야 하므로 로컬 문자열 상태로 관리
  const [localUnitPrice, setLocalUnitPrice] = React.useState(String(item.unitPrice || ''));
  const [localQuantity, setLocalQuantity] = React.useState(String(item.quantity || ''));

  // 외부 props(item)가 변경되면 로컬 상태 동기화 (단, 포커스 중일 때는 제외하는 것이 좋으나 여기선 단순화)
  React.useEffect(() => {
    if (!isEditing) {
      setLocalUnitPrice(String(item.unitPrice || ''));
      setLocalQuantity(String(item.quantity || ''));
    }
  }, [item.unitPrice, item.quantity, isEditing]);

  const handleUnitPriceChange = (v: string) => {
    const clean = v.replace(/[^0-9]/g, '');
    setLocalUnitPrice(clean);
    onUnitPriceChange(clean);
  };

  const handleQuantityChange = (v: string) => {
    const clean = v.replace(/[^0-9]/g, '');
    setLocalQuantity(clean);
    onQuantityChange(clean);
  };

  return (
    <View style={[styles.itemCard, isEditing && styles.itemCardEditing]}>
      <PaymentAnimatedTouchable
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.itemRowTop}
      >
        <View style={styles.nameColumn}>
          {isEditing ? (
            <TextInput
              value={item.name}
              autoFocus
              onChangeText={onNameChange}
              placeholder="메뉴명을 입력하세요"
              placeholderTextColor={AppColorStyles.textHint}
              style={styles.nameInput}
            />
          ) : (
            <Text style={[styles.itemText, !item.name && styles.emptyText]}>
              {item.name || '메뉴명 없음'}
            </Text>
          )}
        </View>
        {!isEditing && (
          <Text style={styles.rowTotalText}>{formatAmount(item.amount)}</Text>
        )}
        <PaymentAnimatedTouchable
          onPress={onRemove}
          style={styles.deleteButton}
        >
          <MaterialDesignIcons name="trash-can-outline" size={20} color={AppColorStyles.caution} />
        </PaymentAnimatedTouchable>
      </PaymentAnimatedTouchable>

      {isEditing && (
        <View style={styles.editControls}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>단가</Text>
            <TextInput
              value={localUnitPrice}
              onChangeText={handleUnitPriceChange}
              placeholder="0"
              keyboardType="number-pad"
              style={styles.inlineInput}
            />
          </View>
          <View style={[styles.inputGroup, styles.quantityGroup]}>
            <Text style={styles.inputLabel}>수량</Text>
            <TextInput
              value={localQuantity}
              onChangeText={handleQuantityChange}
              placeholder="1"
              keyboardType="number-pad"
              style={styles.inlineInput}
            />
          </View>
          <PaymentAnimatedTouchable
            onPress={onDone}
            style={styles.doneButton}
          >
            <MaterialDesignIcons name="check" size={20} color={AppColorStyles.black} />
          </PaymentAnimatedTouchable>
        </View>
      )}
    </View>
  );
}

export function PaymentOcrEditorView({
  draft,
  onStoreNameChange,
  onTotalAmountChange,
  onItemNameChange,
  onItemUnitPriceChange,
  onItemQuantityChange,
  onAddItem,
  onRemoveItem,
  onNext,
}: PaymentOcrEditorViewProps) {
  const [editingItemId, setEditingItemId] = React.useState<number | null>(
    draft.items[0]?.itemId ?? null,
  );

  React.useEffect(() => {
    if (draft.items.length === 0) {
      setEditingItemId(null);
      return;
    }
    if (editingItemId !== null && !draft.items.some((item: any) => item.itemId === editingItemId)) {
      setEditingItemId(draft.items[0]?.itemId ?? null);
    }
  }, [draft.items, editingItemId]);

  const itemsTotal = draft.items.reduce((sum, item) => sum + item.amount, 0);
  const isTotalMismatched = draft.totalAmount !== itemsTotal && draft.items.length > 0;

  const isNextDisabled =
    draft.totalAmount <= 0 ||
    draft.items.length === 0 ||
    draft.items.some((item: any) => item.name.trim().length === 0 || item.amount <= 0);

  return (
    <View style={styles.container}>
      <View style={styles.noticeBanner}>
        <MaterialDesignIcons name="check-circle-outline" size={18} color={AppColorStyles.textSecondary} />
        <Text style={styles.noticeText}>인식 결과를 확인하고 필요시 수정해 주세요</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.storeNameRow}>
          <TextInput
            value={draft.storeName}
            onChangeText={onStoreNameChange}
            placeholder="장소명 입력"
            placeholderTextColor={AppColorStyles.textHint}
            style={styles.storeNameInput}
          />
          <MaterialDesignIcons name="pencil" size={16} color={AppColorStyles.textHint} />
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>결제 일시</Text>
          <Text style={styles.infoValue}>{formatDate(draft.paidAt)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>최종 총액</Text>
          <Text style={styles.totalAmountValue}>{formatAmount(draft.totalAmount)}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>메뉴 항목</Text>
        <Text style={[styles.itemCountText, isTotalMismatched && styles.mismatchText]}>
          {isTotalMismatched ? '⚠️ 합계 불일치' : `총 ${draft.items.length}개`}
        </Text>
      </View>

      <View style={styles.itemsWrapper}>
        {draft.items.map((item: any) => (
          <OcrItemEditableRow
            key={item.itemId}
            item={item}
            isEditing={editingItemId === item.itemId}
            onPress={() => setEditingItemId(item.itemId)}
            onNameChange={(v) => onItemNameChange(item.itemId, v)}
            onUnitPriceChange={(v) => onItemUnitPriceChange(item.itemId, v)}
            onQuantityChange={(v) => onItemQuantityChange(item.itemId, v)}
            onRemove={() => onRemoveItem(item.itemId)}
            onDone={() => setEditingItemId(null)}
          />
        ))}

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onAddItem}
          style={styles.addButton}
        >
          <MaterialDesignIcons name="plus" size={20} color={AppColorStyles.textHint} />
          <Text style={styles.addButtonText}>항목 추가하기</Text>
        </PaymentAnimatedTouchable>
      </View>

      <View style={styles.footerContainer}>
        <View style={styles.footerInfo}>
          <Text style={styles.footerLabel}>현재 항목 합계</Text>
          <Text style={[styles.footerAmount, isTotalMismatched && styles.mismatchText]}>
            {formatAmount(itemsTotal)}
          </Text>
        </View>

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          disabled={isNextDisabled}
          onPress={onNext}
          style={[styles.primaryButton, isNextDisabled && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>다음</Text>
        </PaymentAnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: AppColorStyles.yellowLight,
    borderRadius: 12,
    marginBottom: 16,
    gap: 6,
  },
  noticeText: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.textSecondary,
    }),
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeNameInput: {
    flex: 1,
    ...KBODiaGothicTextStyle.bold({
      fontSize: 24,
      color: AppColorStyles.black,
    }),
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    ...PretendardTextStyle.medium({
      fontSize: 15,
      color: AppColorStyles.textHint,
    }),
  },
  infoValue: {
    ...PretendardTextStyle.semiBold({
      fontSize: 15,
      color: AppColorStyles.gray1,
    }),
  },
  totalAmountValue: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22,
      color: AppColorStyles.gray1,
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 18,
      color: AppColorStyles.black,
    }),
  },
  itemCountText: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.textHint,
    }),
  },
  mismatchText: {
    color: AppColorStyles.caution,
    fontWeight: '700',
  },
  itemsWrapper: {
    gap: 12,
    marginBottom: 32,
  },
  itemCard: {
    borderRadius: 16,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    overflow: 'hidden',
  },
  itemCardEditing: {
    borderColor: AppColorStyles.yellow,
    backgroundColor: AppColorStyles.white,
    elevation: 4,
    shadowColor: AppColorStyles.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  itemRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  nameColumn: {
    flex: 1,
  },
  itemText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 17,
      color: AppColorStyles.gray1,
    }),
  },
  emptyText: {
    color: AppColorStyles.textHint,
    fontStyle: 'italic',
  },
  nameInput: {
    ...PretendardTextStyle.semiBold({
      fontSize: 17,
      color: AppColorStyles.black,
    }),
    padding: 0,
  },
  rowTotalText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 16,
      color: AppColorStyles.gray1,
    }),
  },
  deleteButton: {
    padding: 4,
  },
  editControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: AppColorStyles.divider,
    paddingTop: 12,
  },
  inputGroup: {
    flex: 1,
  },
  quantityGroup: {
    flex: 0.6,
  },
  inputLabel: {
    ...PretendardTextStyle.medium({
      fontSize: 12,
      color: AppColorStyles.textHint,
    }),
    marginBottom: 4,
  },
  inlineInput: {
    height: 40,
    borderRadius: 8,
    backgroundColor: AppColorStyles.gray4,
    paddingHorizontal: 10,
    ...PretendardTextStyle.semiBold({
      fontSize: 15,
      color: AppColorStyles.black,
    }),
  },
  doneButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: AppColorStyles.divider,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  addButtonText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 15,
      color: AppColorStyles.textHint,
    }),
  },
  footerContainer: {
    marginTop: 10,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  footerLabel: {
    ...PretendardTextStyle.semiBold({
      fontSize: 16,
      color: AppColorStyles.textHint,
    }),
  },
  footerAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 22,
      color: AppColorStyles.black,
    }),
  },
  primaryButton: {
    height: 64,
    borderRadius: 18,
    backgroundColor: AppColorStyles.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
    shadowColor: AppColorStyles.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.black,
    }),
  },
});
