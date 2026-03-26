import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import type { PaymentEntryPreview } from '../../../models/types/paymentTypes';

interface PaymentEntryPreviewScreenProps {
  preview: PaymentEntryPreview;
  selectedExpenseTitles: string[];
  onBack: () => void;
  onPrimaryAction: () => void;
}

/**
 * 계좌/OCR/직접 입력 진입 이후의 mock 화면.
 * 실제 폼 대신 필요한 필드 구조와 검토 포인트를 먼저 보여준다.
 */
export function PaymentEntryPreviewScreen({
  preview,
  selectedExpenseTitles,
  onBack,
  onPrimaryAction,
}: PaymentEntryPreviewScreenProps) {
  return (
    <View>
      <View style={styles.heroCard}>
        <Text
          style={PretendardTextStyle.semiBold({
            fontSize: 13,
            color: AppColorStyles.textSecondary,
          })}
        >
          정산 요청 추가
        </Text>
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 24,
            color: AppColorStyles.black,
          })}
        >
          {preview.title}
        </Text>
        {preview.headline && (
          <Text
            style={KBODiaGothicTextStyle.medium({
              fontSize: 18,
              color: AppColorStyles.gray1,
            })}
          >
            {preview.headline}
          </Text>
        )}
        <Text
          style={PretendardTextStyle.regular({
            fontSize: 14,
            lineHeight: 22,
            color: AppColorStyles.textSecondary,
          })}
        >
          {preview.description}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          현재 선택된 결제
        </Text>
        <View style={styles.chipWrap}>
          {selectedExpenseTitles.length === 0 ? (
            <View style={styles.emptyChip}>
              <Text
                style={PretendardTextStyle.medium({
                  fontSize: 12,
                  color: AppColorStyles.textSecondary,
                })}
              >
                선택된 결제 없음
              </Text>
            </View>
          ) : (
            selectedExpenseTitles.map((title) => (
              <View key={title} style={styles.selectedChip}>
                <Text
                  style={PretendardTextStyle.semiBold({
                    fontSize: 12,
                    color: AppColorStyles.black,
                  })}
                >
                  {title}
                </Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          우선 구현할 필드
        </Text>
        <View style={styles.sectionBody}>
          {preview.fieldGuides.map((field: any) => (
            <View key={field.label} style={styles.fieldRow}>
              <Text
                style={PretendardTextStyle.medium({
                  fontSize: 13,
                  color: AppColorStyles.textSecondary,
                })}
              >
                {field.label}
              </Text>
              <Text
                style={PretendardTextStyle.semiBold({
                  fontSize: 13,
                  color: AppColorStyles.black,
                })}
              >
                {field.value || field.description}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          리뷰 포인트
        </Text>
        <View style={styles.sectionBody}>
          {preview.checklist.map((item: any, index: any) => (
            <View key={item} style={styles.checkItem}>
              <View style={styles.checkIndex}>
                <Text
                  style={PretendardTextStyle.semiBold({
                    fontSize: 12,
                    color: AppColorStyles.black,
                  })}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={PretendardTextStyle.regular({
                  fontSize: 14,
                  lineHeight: 22,
                  color: AppColorStyles.textSecondary,
                })}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPrimaryAction}
        style={styles.primaryButton}
      >
        <Text
          style={KBODiaGothicTextStyle.bold({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          {preview.primaryActionLabel || '계속하기'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onBack}
        style={styles.secondaryButton}
      >
        <Text
          style={KBODiaGothicTextStyle.medium({
            fontSize: 16,
            color: AppColorStyles.black,
          })}
        >
          결제 화면으로 돌아가기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    marginBottom: 16,
  },
  sectionBody: {
    marginTop: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  selectedChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColorStyles.yellowLight,
    marginRight: 8,
    marginBottom: 8,
  },
  emptyChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: AppColorStyles.gray4,
  },
  fieldRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColorStyles.divider,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkIndex: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: AppColorStyles.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  primaryButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.yellow,
    marginBottom: 10,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColorStyles.white,
    borderWidth: 1,
    borderColor: AppColorStyles.border,
    marginBottom: 12,
  },
});
