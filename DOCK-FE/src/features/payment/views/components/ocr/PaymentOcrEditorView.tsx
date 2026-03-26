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
  onItemNameChange: (itemId: number, value: string) => void;
  onItemUnitPriceChange: (itemId: number, value: string) => void;
  onItemQuantityChange: (itemId: number, value: string) => void;
  onAddItem: () => void;
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
  const second = String(date.getSeconds()).padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
};

const formatAmount = (amount: number): string => `${amount.toLocaleString('ko-KR')}원`;

const toInputValue = (value: number): string => (value > 0 ? String(value) : '');

export function PaymentOcrEditorView({
  draft,
  onItemNameChange,
  onItemUnitPriceChange,
  onItemQuantityChange,
  onAddItem,
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

    if (!draft.items.some((item: any) => item.itemId === editingItemId)) {
      setEditingItemId(draft.items[0].itemId);
    }
  }, [draft.items, editingItemId]);

  const isNextDisabled =
    draft.totalAmount <= 0 ||
    draft.items.length === 0 ||
    draft.items.some((item: any) => item.name.trim().length === 0);

  return (
    <View>
      <View style={styles.noticeBanner}>
        <Text
          style={PretendardTextStyle.medium({
            fontSize: 15,
            color: AppColorStyles.textSecondary,
          })}
        >
          인식 완료! 내용을 확인해 주세요
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 28,
            color: AppColorStyles.black,
          })}
        >
          {draft.storeName}
        </Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              color: AppColorStyles.textHint,
            })}
          >
            거래시간
          </Text>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              color: AppColorStyles.textHint,
            })}
          >
            {formatDate(draft.paidAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              color: AppColorStyles.textHint,
            })}
          >
            거래금액
          </Text>
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 20,
              color: AppColorStyles.gray1,
            })}
          >
            {formatAmount(draft.totalAmount)}
          </Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.nameColumn]}>메뉴명</Text>
          <Text style={[styles.headerText, styles.priceColumn]}>단가</Text>
          <Text style={[styles.headerText, styles.quantityColumn]}>수량</Text>
          <View style={styles.actionColumn} />
        </View>

        {draft.items.map((item: any) => {
          const isEditing = editingItemId === item.itemId;

          return (
            <View key={item.itemId} style={styles.itemRow}>
              <View style={styles.nameColumn}>
                {isEditing ? (
                  <TextInput
                    value={item.name}
                    onChangeText={(value) => onItemNameChange(item.itemId, value)}
                    placeholder="메뉴명"
                    placeholderTextColor={AppColorStyles.textHint}
                    style={[styles.cellInput, styles.nameInput]}
                  />
                ) : (
                  <Text style={styles.itemText}>{item.name}</Text>
                )}
              </View>

              <View style={styles.priceColumn}>
                {isEditing ? (
                  <TextInput
                    value={toInputValue(item.unitPrice)}
                    onChangeText={(value) => onItemUnitPriceChange(item.itemId, value)}
                    placeholder="0"
                    placeholderTextColor={AppColorStyles.textHint}
                    keyboardType="number-pad"
                    style={[styles.cellInput, styles.numberInput]}
                  />
                ) : (
                  <Text style={styles.itemText}>{item.unitPrice.toLocaleString('ko-KR')}</Text>
                )}
              </View>

              <View style={styles.quantityColumn}>
                {isEditing ? (
                  <TextInput
                    value={String(item.quantity)}
                    onChangeText={(value) => onItemQuantityChange(item.itemId, value)}
                    placeholder="1"
                    placeholderTextColor={AppColorStyles.textHint}
                    keyboardType="number-pad"
                    style={[styles.cellInput, styles.quantityInput]}
                  />
                ) : (
                  <Text style={styles.itemText}>{item.quantity}</Text>
                )}
              </View>

              <View style={styles.actionColumn}>
                {isEditing ? (
                  <PaymentAnimatedTouchable
                    activeOpacity={0.85}
                    onPress={() => setEditingItemId(null)}
                    style={styles.confirmButton}
                  >
                    <Text style={styles.confirmButtonText}>확인</Text>
                  </PaymentAnimatedTouchable>
                ) : (
                  <PaymentAnimatedTouchable
                    activeOpacity={0.85}
                    onPress={() => setEditingItemId(item.itemId)}
                    style={styles.editButton}
                  >
                    <MaterialDesignIcons
                      name="pencil"
                      size={18}
                      color={AppColorStyles.caution}
                    />
                  </PaymentAnimatedTouchable>
                )}
              </View>
            </View>
          );
        })}

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onAddItem}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+ 항목 추가</Text>
        </PaymentAnimatedTouchable>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>항목 합계</Text>
        <Text style={styles.totalAmount}>{formatAmount(draft.totalAmount)}</Text>
      </View>

      <PaymentAnimatedTouchable
        activeOpacity={0.85}
        disabled={isNextDisabled}
        onPress={onNext}
        style={[styles.primaryButton, isNextDisabled && styles.primaryButtonDisabled]}
      >
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 20,
            color: AppColorStyles.black,
          })}
        >
          다음
        </Text>
      </PaymentAnimatedTouchable>
    </View>
  );
}

const styles = StyleSheet.create({
  noticeBanner: {
    height: 48,
    borderRadius: 12,
    backgroundColor: AppColorStyles.yellowLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: AppColorStyles.divider,
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.black,
    }),
  },
  nameColumn: {
    flex: 1.5,
    marginRight: 10,
  },
  priceColumn: {
    flex: 1.1,
    marginRight: 10,
  },
  quantityColumn: {
    width: 54,
    marginRight: 10,
  },
  actionColumn: {
    width: 54,
    alignItems: 'flex-end',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemText: {
    ...PretendardTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray1,
    }),
  },
  cellInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColorStyles.yellow,
    paddingHorizontal: 12,
    backgroundColor: AppColorStyles.white,
    ...PretendardTextStyle.medium({
      fontSize: 16,
      color: AppColorStyles.gray1,
    }),
  },
  nameInput: {
    textAlign: 'left',
  },
  numberInput: {
    textAlign: 'right',
  },
  quantityInput: {
    textAlign: 'center',
  },
  confirmButton: {
    minWidth: 48,
    height: 32,
    borderRadius: 8,
    backgroundColor: AppColorStyles.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  confirmButtonText: {
    ...PretendardTextStyle.semiBold({
      fontSize: 12,
      color: AppColorStyles.black,
    }),
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    marginTop: 4,
  },
  addButtonText: {
    ...PretendardTextStyle.medium({
      fontSize: 14,
      color: AppColorStyles.textHint,
    }),
  },
  totalCard: {
    minHeight: 64,
    borderRadius: 14,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  totalLabel: {
    ...KBODiaGothicTextStyle.medium({
      fontSize: 18,
      color: AppColorStyles.textHint,
    }),
  },
  totalAmount: {
    ...KBODiaGothicTextStyle.bold({
      fontSize: 20,
      color: AppColorStyles.gray1,
    }),
  },
  primaryButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
  },
  primaryButtonDisabled: {
    backgroundColor: AppColorStyles.gray3,
  },
});
