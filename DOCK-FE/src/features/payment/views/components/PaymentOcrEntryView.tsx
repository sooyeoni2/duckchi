import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { PaymentAnimatedTouchable } from './PaymentAnimatedTouchable';

interface PaymentOcrEntryViewProps {
  errorMessage?: string | null;
  onPressCamera: () => void;
  onPressLibrary: () => void;
}

export function PaymentOcrEntryView({
  errorMessage = null,
  onPressCamera,
  onPressLibrary,
}: PaymentOcrEntryViewProps) {
  return (
    <View>
      <View style={styles.descriptionCard}>
        <Text
          style={PretendardTextStyle.regular({
            fontSize: 16,
            lineHeight: 24,
            color: AppColorStyles.textSecondary,
          })}
        >
          영수증을 카메라로 촬영하면
        </Text>
        <Text
          style={PretendardTextStyle.regular({
            fontSize: 16,
            lineHeight: 24,
            color: AppColorStyles.textSecondary,
          })}
        >
          금액과 항목을 자동으로 읽어드려요
        </Text>
      </View>

      {errorMessage != null && (
        <View style={styles.errorBanner}>
          <Text
            style={PretendardTextStyle.medium({
              fontSize: 14,
              lineHeight: 20,
              color: AppColorStyles.gray1,
            })}
          >
            {errorMessage}
          </Text>
        </View>
      )}

      <View style={styles.previewCard}>
        <MaterialDesignIcons
          name="receipt-text-outline"
          size={86}
          color={AppColorStyles.gray2}
        />
      </View>

      <View style={styles.actionRow}>
        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onPressCamera}
          wrapperStyle={styles.primaryActionButtonWrap}
          style={[styles.actionButton, styles.primaryActionButton]}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            촬영하기
          </Text>
        </PaymentAnimatedTouchable>

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onPressLibrary}
          wrapperStyle={styles.secondaryActionButtonWrap}
          style={[styles.actionButton, styles.secondaryActionButton]}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 18,
              color: AppColorStyles.black,
            })}
          >
            앨범
          </Text>
        </PaymentAnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  descriptionCard: {
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: AppColorStyles.yellowLight,
    marginBottom: 16,
  },
  previewCard: {
    height: 220,
    borderRadius: 18,
    backgroundColor: AppColorStyles.surface,
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  primaryActionButtonWrap: {
    flex: 1,
    marginRight: 12,
  },
  secondaryActionButtonWrap: {
    flex: 1,
  },
  actionButton: {
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    backgroundColor: AppColorStyles.yellow,
  },
  secondaryActionButton: {
    borderWidth: 1.5,
    borderColor: AppColorStyles.yellow,
    backgroundColor: AppColorStyles.white,
  },
});
