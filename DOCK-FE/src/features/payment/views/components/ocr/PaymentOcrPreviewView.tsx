import { MaterialCommunityIcons as MaterialDesignIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColorStyles } from '@core/theme/colors';
import {
  KBODiaGothicTextStyle,
  PretendardTextStyle,
} from '@core/theme/typography';
import { PaymentAnimatedTouchable } from '../common/PaymentAnimatedTouchable';

interface PaymentOcrPreviewViewProps {
  imageUri: string;
  onConfirm: () => void;
  onRetake: () => void;
}

export function PaymentOcrPreviewView({
  imageUri,
  onConfirm,
  onRetake,
}: PaymentOcrPreviewViewProps) {
  return (
    <View>
      <View style={styles.descriptionCard}>
        <Text
          style={PretendardTextStyle.bold({
            fontSize: 18,
            color: AppColorStyles.black,
          })}
        >
          영수증 확인
        </Text>
        <Text
          style={[
            PretendardTextStyle.regular({
              fontSize: 14,
              lineHeight: 22,
              color: AppColorStyles.textSecondary,
            }),
            { marginTop: 4 },
          ]}
        >
          글자가 잘 보이도록 촬영되었나요?{'\n'}영수증이 흔들렸다면 다시 촬영해 주세요.
        </Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.actionRow}>
        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onRetake}
          wrapperStyle={styles.secondaryActionButtonWrap}
          style={[styles.actionButton, styles.secondaryActionButton]}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 16,
              color: AppColorStyles.gray1,
            })}
          >
            다시 찍기
          </Text>
        </PaymentAnimatedTouchable>

        <PaymentAnimatedTouchable
          activeOpacity={0.85}
          onPress={onConfirm}
          wrapperStyle={styles.primaryActionButtonWrap}
          style={[styles.actionButton, styles.primaryActionButton]}
        >
          <Text
            style={KBODiaGothicTextStyle.bold({
              fontSize: 16,
              color: AppColorStyles.black,
            })}
          >
            이 사진으로 분석
          </Text>
        </PaymentAnimatedTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  descriptionCard: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  imageContainer: {
    height: 380,
    borderRadius: 18,
    backgroundColor: AppColorStyles.black,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColorStyles.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  primaryActionButtonWrap: {
    flex: 6,
  },
  secondaryActionButtonWrap: {
    flex: 4,
    marginRight: 12,
  },
  actionButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButton: {
    backgroundColor: AppColorStyles.yellow,
  },
  secondaryActionButton: {
    borderWidth: 1.5,
    borderColor: AppColorStyles.divider,
    backgroundColor: AppColorStyles.white,
  },
});
